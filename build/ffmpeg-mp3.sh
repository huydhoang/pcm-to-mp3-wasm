#!/bin/bash
# Minimal FFmpeg build for PCM to MP3 conversion only

set -euo pipefail

CONF_FLAGS=(
  --target-os=none              # disable target specific configs
  --arch=x86_32                 # use x86_32 arch
  --enable-cross-compile        # use cross compile configs
  --disable-asm                 # disable asm
  --disable-stripping           # disable stripping as it won't work
  --disable-programs            # disable ffmpeg, ffprobe and ffplay build
  --disable-doc                 # disable doc build
  --disable-debug               # disable debug mode
  --disable-runtime-cpudetect   # disable cpu detection
  --disable-autodetect          # disable env auto detect

  # Disable components we don't need
  --disable-avdevice
  --disable-postproc
  --disable-network

  # Keep swscale (needed by fftools) but minimal
  # Keep avfilter (needed by fftools) but with minimal filters

  # Disable most codecs first, enable only what we need
  --disable-encoders
  --disable-decoders
  --disable-muxers
  --disable-demuxers
  --disable-parsers
  --disable-bsfs
  --disable-protocols
  --disable-devices
  --disable-filters

  # Enable only PCM decoders (for raw audio input)
  --enable-decoder=pcm_s16le
  --enable-decoder=pcm_s16be
  --enable-decoder=pcm_s24le
  --enable-decoder=pcm_s32le
  --enable-decoder=pcm_f32le
  --enable-decoder=pcm_f64le
  --enable-decoder=pcm_u8

  # Enable MP3 encoder (via libmp3lame)
  --enable-encoder=libmp3lame

  # Enable muxers
  --enable-muxer=mp3

  # Enable demuxers for raw audio
  --enable-demuxer=pcm_s16le
  --enable-demuxer=pcm_s16be
  --enable-demuxer=pcm_s24le
  --enable-demuxer=pcm_s32le
  --enable-demuxer=pcm_f32le
  --enable-demuxer=pcm_f64le
  --enable-demuxer=pcm_u8
  --enable-demuxer=s16le
  --enable-demuxer=s16be
  --enable-demuxer=s24le
  --enable-demuxer=s32le
  --enable-demuxer=f32le
  --enable-demuxer=f64le
  --enable-demuxer=u8

  # Enable essential filters for audio processing
  --enable-filter=aformat
  --enable-filter=anull
  --enable-filter=aresample
  --enable-filter=abuffer
  --enable-filter=abuffersink

  # Enable file protocol
  --enable-protocol=file

  # Enable libmp3lame
  --enable-gpl
  --enable-libmp3lame

  # Assign toolchains and extra flags
  --nm=emnm
  --ar=emar
  --ranlib=emranlib
  --cc=emcc
  --cxx=em++
  --objcc=emcc
  --dep-cc=emcc
  --extra-cflags="$CFLAGS"
  --extra-cxxflags="$CXXFLAGS"

  # Disable threading for single-threaded build
  ${FFMPEG_ST:+ --disable-pthreads --disable-w32threads --disable-os2threads}
)

emconfigure ./configure "${CONF_FLAGS[@]}"
emmake make -j
