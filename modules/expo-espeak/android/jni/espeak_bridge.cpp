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

// ---------------------------------------------------------------------------
// Synthesis callback — called by eSpeak's FIFO thread for each PCM chunk.
// Must return 0 to continue synthesis, 1 to stop early.
// ---------------------------------------------------------------------------
static int synth_callback(short *wav, int num_samples, espeak_EVENT *events) {
    (void)events;
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
        0              // options
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
