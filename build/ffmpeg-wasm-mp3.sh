#!/bin/bash
# Minimal ffmpeg.wasm link script for PCM to MP3 only
# `-o <OUTPUT_FILE_NAME>` must be provided when using this build script.

set -euo pipefail

EXPORT_NAME="createFFmpegCore"

CONF_FLAGS=(
  -I. 
  -I./src/fftools 
  -I$INSTALL_DIR/include 
  -L$INSTALL_DIR/lib 
  -Llibavcodec 
  -Llibavfilter
  -Llibavformat 
  -Llibavutil 
  -Llibswresample 
  -Llibswscale
  -lavcodec 
  -lavfilter
  -lavformat 
  -lavutil 
  -lswresample 
  -lswscale
  -Wno-deprecated-declarations 
  $LDFLAGS 
  -sENVIRONMENT=worker
  -sWASM_BIGINT                            # enable big int support
  -sINITIAL_MEMORY=16MB                    # reduced memory for audio-only
  -sALLOW_MEMORY_GROWTH                    # allow memory to grow if needed
  -sSTACK_SIZE=1MB                         # reduced stack size
  -sMODULARIZE                             # modularized to use as a library
  -sEXPORT_NAME="$EXPORT_NAME"             # required in browser env
  -sEXPORTED_FUNCTIONS=$(node src/bind/ffmpeg/export-mp3.js) # exported functions
  -sEXPORTED_RUNTIME_METHODS=$(node src/bind/ffmpeg/export-runtime.js)
  -lworkerfs.js
  --pre-js src/bind/ffmpeg/bind.js        # extra bindings
  # ffmpeg source code (excluding ffprobe for size reduction)
  src/fftools/cmdutils.c 
  src/fftools/ffmpeg.c 
  src/fftools/ffmpeg_filter.c 
  src/fftools/ffmpeg_hw.c 
  src/fftools/ffmpeg_mux.c 
  src/fftools/ffmpeg_opt.c 
  src/fftools/opt_common.c 
)

emcc "${CONF_FLAGS[@]}" $@
