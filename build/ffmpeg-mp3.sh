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

  # Enable only PCM decoders matching Cartesia SSE output formats
  # See: https://docs.cartesia.ai/api-reference/tts/sse
  --enable-decoder=pcm_s16le    # 16-bit signed little-endian
  --enable-decoder=pcm_f32le    # 32-bit float little-endian (default)
  --enable-decoder=pcm_mulaw    # μ-law (telephony)
  --enable-decoder=pcm_alaw     # A-law (telephony)

  # Enable MP3 encoder (via libmp3lame)
  --enable-encoder=libmp3lame

  # Enable muxers
  --enable-muxer=mp3

  # Enable demuxers for raw audio (matching Cartesia formats)
  --enable-demuxer=pcm_s16le
  --enable-demuxer=pcm_f32le
  --enable-demuxer=pcm_mulaw
  --enable-demuxer=pcm_alaw
  --enable-demuxer=s16le
  --enable-demuxer=f32le
  --enable-demuxer=mulaw
  --enable-demuxer=alaw

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
