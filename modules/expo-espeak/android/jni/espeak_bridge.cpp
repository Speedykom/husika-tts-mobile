#include <jni.h>
#include <android/log.h>
#include <string>
#include <vector>
#include <fstream>
#include <cstring>
#include <cstdint>

extern "C" {
#include <espeak-ng/espeak_ng.h>
#include <espeak/speak_lib.h>
}

#define TAG "EspeakBridge"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

static std::vector<int16_t> g_pcm_buffer;
static bool g_initialized = false;
static int g_sample_rate = 22050;

// Piper phonemization state
static std::vector<std::string> g_phoneme_buffer;
static bool g_phonemize_mode = false;

// ---------------------------------------------------------------------------
// Synthesis callback — called by eSpeak's FIFO thread for each PCM chunk.
// Must return 0 to continue synthesis, 1 to stop early.
// ---------------------------------------------------------------------------
static int synth_callback(short *wav, int num_samples, espeak_EVENT *events) {
    if (g_phonemize_mode) {
        if (events) {
            espeak_EVENT *e = events;
            while (e->type != espeakEVENT_LIST_TERMINATED) {
                if (e->type == espeakEVENT_WORD && !g_phoneme_buffer.empty()) {
                    // Insert word-boundary silence token between words
                    g_phoneme_buffer.push_back(" ");
                } else if (e->type == espeakEVENT_PHONEME && e->id.string[0] != '\0') {
                    // IPA phoneme string (up to 7 UTF-8 bytes + null)
                    size_t len = strnlen(e->id.string, 8);
                    g_phoneme_buffer.push_back(std::string(e->id.string, len));
                }
                e++;
            }
        }
        return 0;
    }
    if (wav != nullptr && num_samples > 0) {
        g_pcm_buffer.insert(g_pcm_buffer.end(), wav, wav + num_samples);
    }
    return 0;
}

// ---------------------------------------------------------------------------
// Write a minimal PCM 16-bit mono WAV file
// ---------------------------------------------------------------------------
static bool write_wav(const std::string &path,
                      const std::vector<int16_t> &pcm,
                      int sample_rate) {
    std::ofstream f(path, std::ios::binary);
    if (!f.is_open()) {
        LOGE("Cannot open output file: %s", path.c_str());
        return false;
    }

    const uint32_t data_size   = static_cast<uint32_t>(pcm.size() * 2);
    const uint32_t chunk_size  = 36 + data_size;
    const uint16_t num_ch      = 1;
    const uint32_t byte_rate   = static_cast<uint32_t>(sample_rate) * 2;
    const uint16_t block_align = 2;
    const uint16_t bits        = 16;
    const uint32_t subchunk1   = 16;
    const uint16_t audio_fmt   = 1; // PCM

    f.write("RIFF", 4);
    f.write(reinterpret_cast<const char*>(&chunk_size),  4);
    f.write("WAVE", 4);
    f.write("fmt ", 4);
    f.write(reinterpret_cast<const char*>(&subchunk1),   4);
    f.write(reinterpret_cast<const char*>(&audio_fmt),   2);
    f.write(reinterpret_cast<const char*>(&num_ch),      2);
    f.write(reinterpret_cast<const char*>(&sample_rate), 4);
    f.write(reinterpret_cast<const char*>(&byte_rate),   4);
    f.write(reinterpret_cast<const char*>(&block_align), 2);
    f.write(reinterpret_cast<const char*>(&bits),        2);
    f.write("data", 4);
    f.write(reinterpret_cast<const char*>(&data_size),   4);
    if (!pcm.empty()) {
        f.write(reinterpret_cast<const char*>(pcm.data()), data_size);
    }

    return f.good();
}

// ---------------------------------------------------------------------------
// JNI: initialize eSpeak NG
// dataParentPath: the PARENT directory of espeak-ng-data (i.e. filesDir)
// ---------------------------------------------------------------------------
extern "C" JNIEXPORT jint JNICALL
Java_expo_modules_espeak_ExpoEspeakModule_nativeInit(
        JNIEnv *env, jobject /* this */,
        jstring jDataParentPath) {
    if (g_initialized) return 0;

    const char *dataParentPath = env->GetStringUTFChars(jDataParentPath, nullptr);
    LOGI("Initializing eSpeak NG with data parent: %s", dataParentPath);

    // espeak_Initialize looks for <dataParentPath>/espeak-ng-data
    int sample_rate = espeak_Initialize(
        AUDIO_OUTPUT_RETRIEVAL,
        200,           // buffer length in ms
        dataParentPath,
        espeakINITIALIZE_PHONEME_EVENTS | espeakINITIALIZE_PHONEME_IPA
    );

    env->ReleaseStringUTFChars(jDataParentPath, dataParentPath);

    if (sample_rate < 0) {
        LOGE("espeak_Initialize failed: %d", sample_rate);
        return -1;
    }

    g_sample_rate = sample_rate;
    espeak_SetSynthCallback(synth_callback);
    g_initialized = true;

    LOGI("eSpeak NG ready, sample_rate=%d", sample_rate);
    return 0;
}

// ---------------------------------------------------------------------------
// JNI: synthesize text → WAV file
// voice: eSpeak voice name (e.g. "om", "sw", "am", "en")
// Returns: sample_rate (> 0) on success, negative error code
// ---------------------------------------------------------------------------
extern "C" JNIEXPORT jint JNICALL
Java_expo_modules_espeak_ExpoEspeakModule_nativeSynthesize(
        JNIEnv *env, jobject /* this */,
        jstring jText,
        jstring jVoice,
        jint speed,
        jint pitch,
        jstring jOutputPath) {
    if (!g_initialized) {
        LOGE("eSpeak not initialized");
        return -1;
    }

    const char *text       = env->GetStringUTFChars(jText, nullptr);
    const char *voice      = env->GetStringUTFChars(jVoice, nullptr);
    const char *outputPath = env->GetStringUTFChars(jOutputPath, nullptr);

    espeak_ERROR voice_err = espeak_SetVoiceByName(voice);
    if (voice_err != EE_OK) {
        LOGE("espeak_SetVoiceByName('%s') failed: %d — falling back to 'en'", voice, voice_err);
        espeak_SetVoiceByName("en");
    }

    espeak_SetParameter(espeakRATE,  static_cast<int>(speed), 0);
    espeak_SetParameter(espeakPITCH, static_cast<int>(pitch), 0);

    g_pcm_buffer.clear();

    espeak_ERROR synth_err = espeak_Synth(
        text,
        strlen(text) + 1,
        0,              // position
        POS_CHARACTER,  // position type
        0,              // end position (0 = to end)
        espeakCHARS_UTF8,
        nullptr,        // unique identifier
        nullptr         // user data
    );

    // Wait for the FIFO thread to finish synthesis
    espeak_Synchronize();

    env->ReleaseStringUTFChars(jText, text);
    env->ReleaseStringUTFChars(jVoice, voice);

    if (synth_err != EE_OK) {
        LOGE("espeak_Synth failed: %d", synth_err);
        env->ReleaseStringUTFChars(jOutputPath, outputPath);
        return -2;
    }

    bool ok = write_wav(std::string(outputPath), g_pcm_buffer, g_sample_rate);
    env->ReleaseStringUTFChars(jOutputPath, outputPath);

    if (!ok) return -3;

    LOGI("Synthesized %zu samples to %s", g_pcm_buffer.size(), outputPath);
    return g_sample_rate;
}

// ---------------------------------------------------------------------------
// JNI: phonemize text → tab-separated IPA phoneme tokens (for Piper TTS)
// Returns empty string on failure.
// Word boundaries are represented by a " " (space) token between words.
// ---------------------------------------------------------------------------
extern "C" JNIEXPORT jstring JNICALL
Java_expo_modules_espeak_ExpoEspeakModule_nativePhonemize(
        JNIEnv *env, jobject /* this */,
        jstring jText,
        jstring jVoice) {
    if (!g_initialized) {
        LOGE("nativePhonemize: eSpeak not initialized");
        return env->NewStringUTF("");
    }

    const char *text  = env->GetStringUTFChars(jText,  nullptr);
    const char *voice = env->GetStringUTFChars(jVoice, nullptr);

    espeak_ERROR voice_err = espeak_SetVoiceByName(voice);
    if (voice_err != EE_OK) {
        LOGE("nativePhonemize: SetVoiceByName('%s') failed: %d", voice, voice_err);
        // Try base language (strip accent suffix: "en-us" → "en", "fr-fr" → "fr")
        std::string baseVoice(voice);
        size_t dash = baseVoice.rfind('-');
        if (dash != std::string::npos) {
            baseVoice = baseVoice.substr(0, dash);
            LOGI("nativePhonemize: retrying with base voice '%s'", baseVoice.c_str());
            espeak_SetVoiceByName(baseVoice.c_str());
        }
    }

    g_phoneme_buffer.clear();
    g_phonemize_mode = true;

    espeak_Synth(
        text,
        strlen(text) + 1,
        0,              // position
        POS_CHARACTER,
        0,              // end position
        espeakCHARS_UTF8,
        nullptr,
        nullptr
    );
    espeak_Synchronize();

    g_phonemize_mode = false;

    env->ReleaseStringUTFChars(jText,  text);
    env->ReleaseStringUTFChars(jVoice, voice);

    // Build tab-separated phoneme token string for easy splitting in Kotlin
    std::string result;
    for (size_t i = 0; i < g_phoneme_buffer.size(); i++) {
        if (i > 0) result += "\t";
        result += g_phoneme_buffer[i];
    }

    LOGI("nativePhonemize: %zu tokens: %s", g_phoneme_buffer.size(), result.c_str());
    return env->NewStringUTF(result.c_str());
}
