package expo.modules.espeak

import android.content.Context
import android.content.res.AssetManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

class ExpoEspeakModule : Module() {

    companion object {
        private const val DATA_PREFS = "expo_espeak_prefs"
        private const val KEY_VERSION = "data_version"
        private const val CURRENT_VERSION = 1
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

    override fun definition() = ModuleDefinition {
        Name("ExpoEspeak")

        AsyncFunction("initializeAsync") Coroutine { ->
            initializeIfNeeded()
        }

        AsyncFunction("synthesizeAsync") Coroutine { text: String, voice: String, speed: Int, pitch: Int ->
            initializeIfNeeded()
            synthesize(text, voice, speed, pitch)
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