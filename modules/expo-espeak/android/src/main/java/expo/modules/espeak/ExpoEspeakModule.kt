package expo.modules.espeak

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import android.content.Context
import android.content.res.AssetManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.nio.LongBuffer

class ExpoEspeakModule : Module() {

    companion object {
        private const val DATA_PREFS = "expo_espeak_prefs"
        private const val KEY_VERSION = "data_version"
        private const val CURRENT_VERSION = 2
        private const val ASSET_DIR = "espeak-ng-data"

        init {
            System.loadLibrary("espeak_bridge")
        }
    }

    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    private var initialized = false

    // JNI — method names must match Java_expo_modules_espeak_ExpoEspeakModule_* in espeak_bridge.cpp
    private external fun nativeInit(dataParentPath: String): Int
    private external fun nativeSynthesize(
        text: String,
        voice: String,
        speed: Int,
        pitch: Int,
        outputPath: String
    ): Int
    private external fun nativePhonemize(text: String, voice: String): String

    override fun definition() = ModuleDefinition {
        Name("ExpoEspeak")

        AsyncFunction("initializeAsync") Coroutine { ->
            initializeIfNeeded()
        }

        AsyncFunction("synthesizeAsync") Coroutine { text: String, voice: String, speed: Int, pitch: Int ->
            initializeIfNeeded()
            synthesize(text, voice, speed, pitch)
        }

        AsyncFunction("piperSynthesizeAsync") Coroutine { text: String, onnxPath: String, configPath: String ->
            initializeIfNeeded()
            piperSynthesize(text, onnxPath, configPath)
        }
    }

    // -----------------------------------------------------------------------

    private suspend fun initializeIfNeeded() = withContext(Dispatchers.IO) {
        if (initialized) return@withContext

        val prefs = context.getSharedPreferences(DATA_PREFS, Context.MODE_PRIVATE)
        val installedVersion = prefs.getInt(KEY_VERSION, 0)
        val dataParentDir = context.filesDir  // espeak_Initialize looks for dataParentDir/espeak-ng-data

        if (installedVersion < CURRENT_VERSION || !File(dataParentDir, ASSET_DIR).exists()) {
            copyAssets(context.assets, ASSET_DIR, File(dataParentDir, ASSET_DIR))
            prefs.edit().putInt(KEY_VERSION, CURRENT_VERSION).apply()
        }

        val result = nativeInit(dataParentDir.absolutePath)
        if (result < 0) {
            throw RuntimeException("eSpeak NG initialization failed (code $result)")
        }
        initialized = true
    }

    /**
     * Recursively copies an asset directory or file to the target path on disk.
     * AssetManager.list() returns subdirectory entries; an empty list means it's a file.
     */
    private fun copyAssets(assets: AssetManager, assetPath: String, target: File) {
        val entries = assets.list(assetPath) ?: emptyArray()

        if (entries.isEmpty()) {
            target.parentFile?.mkdirs()
            assets.open(assetPath).use { input ->
                FileOutputStream(target).use { output -> input.copyTo(output) }
            }
        } else {
            target.mkdirs()
            for (entry in entries) {
                copyAssets(assets, "$assetPath/$entry", File(target, entry))
            }
        }
    }

    // -----------------------------------------------------------------------

    private suspend fun synthesize(
        text: String,
        voice: String,
        speed: Int,
        pitch: Int
    ): Map<String, Any> = withContext(Dispatchers.IO) {
        val outFile = File(context.cacheDir, "espeak_${System.nanoTime()}.wav")

        val espeakVoice = mapVoice(voice)
        val sampleRate = nativeSynthesize(text, espeakVoice, speed, pitch, outFile.absolutePath)

        if (sampleRate < 0) {
            throw RuntimeException("eSpeak synthesis failed (code $sampleRate, voice=$espeakVoice)")
        }

        val dataBytes = (outFile.length() - 44L).coerceAtLeast(0L)
        val durationMs = if (sampleRate > 0 && dataBytes > 0) {
            ((dataBytes / 2L) * 1000L / sampleRate).toInt()
        } else 0

        mapOf(
            "wavPath" to outFile.absolutePath,
            "durationMs" to durationMs
        )
    }

    // -----------------------------------------------------------------------
    // Piper on-device synthesis via ONNX Runtime
    // -----------------------------------------------------------------------

    private suspend fun piperSynthesize(
        text: String,
        onnxPath: String,
        configPath: String
    ): Map<String, Any> = withContext(Dispatchers.IO) {
        // 1. Parse the Piper voice config JSON
        val config = JSONObject(File(configPath).readText())
        val audioConfig   = config.getJSONObject("audio")
        val sampleRate    = audioConfig.getInt("sample_rate")
        val inference     = config.getJSONObject("inference")
        val noiseScale    = inference.getDouble("noise_scale").toFloat()
        val lengthScale   = inference.getDouble("length_scale").toFloat()
        val noiseW        = inference.getDouble("noise_w").toFloat()
        val espeakVoice   = config.getJSONObject("espeak").getString("voice")

        val phonemeIdMapJson = config.getJSONObject("phoneme_id_map")
        val phonemeIdMap = HashMap<String, LongArray>(phonemeIdMapJson.length())
        for (key in phonemeIdMapJson.keys()) {
            val arr = phonemeIdMapJson.getJSONArray(key)
            phonemeIdMap[key] = LongArray(arr.length()) { arr.getLong(it) }
        }

        // 2. Get IPA phonemes from eSpeak NG via synthesis event capture
        val rawPhonemes = nativePhonemize(text, espeakVoice)
        val phonemeTokens = if (rawPhonemes.isBlank()) emptyList()
                            else rawPhonemes.split("\t")

        // 3. Build input ID sequence using Piper's pad-interspersion algorithm:
        //    BOS, PAD, (phoneme, PAD)×N, EOS
        //    Source: piper-phonemize/src/phoneme_ids.cpp — interspersePad=true by default.
        val ids = mutableListOf<Long>()
        val padIds = phonemeIdMap["_"] ?: longArrayOf(0L)
        val bosIds = phonemeIdMap["^"] ?: longArrayOf(1L)
        val eosIds = phonemeIdMap["\$"] ?: longArrayOf(2L)

        fun addPad() { padIds.forEach { ids.add(it) } }

        fun addSymbol(symbol: String) {
            val direct = phonemeIdMap[symbol]
            if (direct != null) {
                direct.forEach { ids.add(it) }
                addPad()
            } else {
                // Multi-char diphthong (e.g. "əʊ", "aʊ", "eɪ") — each codepoint
                // is its own phoneme entry followed by its own pad.
                symbol.codePoints().forEach { cp ->
                    phonemeIdMap[String(Character.toChars(cp))]?.let { charIds ->
                        charIds.forEach { ids.add(it) }
                        addPad()
                    }
                }
            }
        }

        bosIds.forEach { ids.add(it) }
        addPad()
        for (token in phonemeTokens) {
            addSymbol(token)
        }
        eosIds.forEach { ids.add(it) }  // no trailing pad after EOS

        if (ids.isEmpty()) throw RuntimeException("Piper: phonemization produced no IDs for text: $text")

        // 4. Run ONNX inference
        val env = OrtEnvironment.getEnvironment()
        val session = env.createSession(onnxPath, OrtSession.SessionOptions())

        val seqLen = ids.size.toLong()
        val inputTensor = OnnxTensor.createTensor(
            env,
            LongBuffer.wrap(ids.toLongArray()),
            longArrayOf(1, seqLen)
        )
        val lengthsTensor = OnnxTensor.createTensor(
            env,
            LongBuffer.wrap(longArrayOf(seqLen)),
            longArrayOf(1)
        )
        val scalesTensor = OnnxTensor.createTensor(
            env,
            FloatBuffer.wrap(floatArrayOf(noiseScale, lengthScale, noiseW)),
            longArrayOf(3)
        )

        val inputs = mapOf(
            "input"        to inputTensor,
            "input_lengths" to lengthsTensor,
            "scales"       to scalesTensor
        )
        val results = session.run(inputs)
        val audioTensor = results.get(0) as OnnxTensor
        val floatBuf: FloatBuffer = audioTensor.floatBuffer

        // 5. Convert float32 [-1,1] audio to int16 PCM
        val numSamples = floatBuf.remaining()
        val pcm = ShortArray(numSamples)
        for (i in 0 until numSamples) {
            val f = floatBuf.get().coerceIn(-1f, 1f)
            pcm[i] = (f * 32767f).toInt().toShort()
        }

        results.close()
        session.close()

        // 6. Write WAV and return path
        val outFile = File(context.cacheDir, "piper_${System.nanoTime()}.wav")
        writePcmWav(outFile, pcm, sampleRate)

        val durationMs = (pcm.size.toLong() * 1000L / sampleRate).toInt()
        mapOf("wavPath" to outFile.absolutePath, "durationMs" to durationMs)
    }

    private fun writePcmWav(file: File, pcm: ShortArray, sampleRate: Int) {
        val dataBytes = pcm.size * 2
        file.outputStream().buffered().use { out ->
            val hdr = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
            hdr.put("RIFF".toByteArray())
            hdr.putInt(36 + dataBytes)
            hdr.put("WAVE".toByteArray())
            hdr.put("fmt ".toByteArray())
            hdr.putInt(16)          // PCM chunk size
            hdr.putShort(1)         // PCM format
            hdr.putShort(1)         // mono
            hdr.putInt(sampleRate)
            hdr.putInt(sampleRate * 2)   // byte rate
            hdr.putShort(2)         // block align
            hdr.putShort(16)        // bits per sample
            hdr.put("data".toByteArray())
            hdr.putInt(dataBytes)
            out.write(hdr.array())

            val dataBuf = ByteBuffer.allocate(dataBytes).order(ByteOrder.LITTLE_ENDIAN)
            for (s in pcm) dataBuf.putShort(s)
            out.write(dataBuf.array())
        }
    }

    /**
     * Maps the app's voice tag (e.g. "espeak-so") to an eSpeak voice name.
     * Languages not natively supported by eSpeak NG 1.50 fall back to a
     * phonologically related language that IS supported:
     *   so  (Somali)      → om  (Oromo)      — both Cushitic Afroasiatic
     *   ti  (Tigrinya)    → am  (Amharic)    — both Ethiopian Semitic
     *   rw  (Kinyarwanda) → sw  (Swahili)    — both Bantu
     *   rn  (Kirundi)     → sw  (Swahili)    — both Bantu
     *   lg  (Luganda)     → sw  (Swahili)    — both Bantu
     */
    private fun mapVoice(voice: String): String = when (voice) {
        "espeak-so" -> "om"
        "espeak-om" -> "om"
        "espeak-ti" -> "am"
        "espeak-rw" -> "sw"
        "espeak-rn" -> "sw"
        "espeak-lg" -> "sw"
        else -> voice.removePrefix("espeak-").ifEmpty { "en" }
    }
}