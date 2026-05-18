cmake_minimum_required(VERSION 3.16)
project(espeak_bridge)

# 16 KB page size alignment for Android 15+
add_link_options("-Wl,-z,max-page-size=16384")
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_C_STANDARD 11)

set(ESPEAK_SRC  ${CMAKE_SOURCE_DIR}/espeak-ng-src/libespeak-ng)
set(ESPEAK_INC  ${CMAKE_SOURCE_DIR}/espeak-ng-src/include)
set(UCD_SRC     ${CMAKE_SOURCE_DIR}/espeak-ng-src/ucd-tools)
set(CONFIG_DIR  ${CMAKE_SOURCE_DIR}/espeak-ng-src)
set(JNI_SRC     ${CMAKE_SOURCE_DIR}/jni)

# eSpeak NG core synthesis sources (mirrors the official Android.mk source list)
set(ESPEAK_SOURCES
    ${ESPEAK_SRC}/compiledata.c
    ${ESPEAK_SRC}/compiledict.c
    ${ESPEAK_SRC}/compilembrola.c
    ${ESPEAK_SRC}/dictionary.c
    ${ESPEAK_SRC}/encoding.c
    ${ESPEAK_SRC}/error.c
    ${ESPEAK_SRC}/espeak_api.c
    ${ESPEAK_SRC}/ieee80.c
    ${ESPEAK_SRC}/intonation.c
    ${ESPEAK_SRC}/klatt.c
    ${ESPEAK_SRC}/mnemonics.c
    ${ESPEAK_SRC}/numbers.c
    ${ESPEAK_SRC}/phoneme.c
    ${ESPEAK_SRC}/phonemelist.c
    ${ESPEAK_SRC}/readclause.c
    ${ESPEAK_SRC}/setlengths.c
    ${ESPEAK_SRC}/spect.c
    ${ESPEAK_SRC}/speech.c
    ${ESPEAK_SRC}/ssml.c
    ${ESPEAK_SRC}/synthdata.c
    ${ESPEAK_SRC}/synthesize.c
    ${ESPEAK_SRC}/synth_mbrola.c
    ${ESPEAK_SRC}/translate.c
    ${ESPEAK_SRC}/tr_languages.c
    ${ESPEAK_SRC}/voices.c
    ${ESPEAK_SRC}/wavegen.c
)

# ucd-tools Unicode support
set(UCD_SOURCES
    ${UCD_SRC}/case.c
    ${UCD_SRC}/categories.c
    ${UCD_SRC}/ctype.c
    ${UCD_SRC}/proplist.c
    ${UCD_SRC}/scripts.c
    ${UCD_SRC}/tostring.c
)

add_library(espeak_bridge SHARED
    ${ESPEAK_SOURCES}
    ${UCD_SOURCES}
    ${JNI_SRC}/espeak_bridge.cpp
)

target_include_directories(espeak_bridge PRIVATE
    ${CONFIG_DIR}          # espeak-ng-src/ — has config.h
    ${ESPEAK_SRC}          # libespeak-ng/ — also has config.h copy + internal headers
    ${ESPEAK_INC}
    ${ESPEAK_INC}/espeak-ng
    ${ESPEAK_INC}/espeak
    ${UCD_SRC}/include
)

target_compile_definitions(espeak_bridge PRIVATE
    PLATFORM_ANDROID=1
    INCLUDE_KLATT=1
    _GNU_SOURCE=1   # needed for M_PI in klatt.c and wavegen.c
)

find_library(LOG_LIB log)
find_library(ANDROID_LIB android)

target_link_libraries(espeak_bridge
    ${LOG_LIB}
    ${ANDROID_LIB}
)

target_compile_options(espeak_bridge PRIVATE
    -Wno-unused-variable
    -Wno-unused-function
    -Wno-implicit-function-declaration
    -Wno-incompatible-pointer-types
    -Wno-int-conversion
    -Wno-dangling-else
)
