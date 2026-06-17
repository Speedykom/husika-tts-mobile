/* Android-specific config.h for eSpeak NG */
#define PACKAGE_VERSION "1.50"

/* No audio backends on Android — using AUDIO_OUTPUT_RETRIEVAL only */
#undef  HAVE_PCAUDIOLIB_AUDIO_H
#undef  HAVE_PULSEAUDIO
#undef  HAVE_PORTAUDIO
#undef  HAVE_SADA

/* No MBROLA on Android */
#undef  HAVE_MBROLA

/* No Sonic (speed-change library) */
#undef  HAVE_SONIC_H

/* Standard C features available in Android NDK */
#define HAVE_STDINT_H 1
#define HAVE_STDBOOL_H 1

/* Enable Klatt synthesizer */
#define INCLUDE_KLATT 1

/* pthread is available via Android NDK */
#define HAVE_PTHREAD_H 1
