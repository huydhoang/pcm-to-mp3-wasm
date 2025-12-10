all: dev

MT_FLAGS := -sUSE_PTHREADS -pthread

DEV_ARGS := --progress=plain

DEV_CFLAGS := --profiling
DEV_MT_CFLAGS := $(DEV_CFLAGS) $(MT_FLAGS)
PROD_CFLAGS := -O3 -msimd128
PROD_MT_CFLAGS := $(PROD_CFLAGS) $(MT_FLAGS)

clean:
	rm -rf ./packages/core$(PKG_SUFFIX)/dist

.PHONY: build
build:
	make clean PKG_SUFFIX="$(PKG_SUFFIX)"
	EXTRA_CFLAGS="$(EXTRA_CFLAGS)" \
	EXTRA_LDFLAGS="$(EXTRA_LDFLAGS)" \
	FFMPEG_ST="$(FFMPEG_ST)" \
	FFMPEG_MT="$(FFMPEG_MT)" \
		docker buildx build \
			--build-arg EXTRA_CFLAGS \
			--build-arg EXTRA_LDFLAGS \
			--build-arg FFMPEG_MT \
			--build-arg FFMPEG_ST \
			-o ./packages/core$(PKG_SUFFIX) \
			$(EXTRA_ARGS) \
			.

build-st:
	make build \
		FFMPEG_ST=yes

build-mt:
	make build \
		PKG_SUFFIX=-mt \
		FFMPEG_MT=yes

dev:
	make build-st EXTRA_CFLAGS="$(DEV_CFLAGS)" EXTRA_ARGS="$(DEV_ARGS)"

dev-mt:
	make build-mt EXTRA_CFLAGS="$(DEV_MT_CFLAGS)" EXTRA_ARGS="$(DEV_ARGS)"

prd:
	make build-st EXTRA_CFLAGS="$(PROD_CFLAGS)"

prd-mt:
	make build-mt EXTRA_CFLAGS="$(PROD_MT_CFLAGS)"

# Minimal MP3-only build targets
.PHONY: build-mp3
build-mp3:
	rm -rf ./packages/core-mp3/dist
	EXTRA_CFLAGS="$(EXTRA_CFLAGS)" \
	EXTRA_LDFLAGS="$(EXTRA_LDFLAGS)" \
	FFMPEG_ST="$(FFMPEG_ST)" \
	FFMPEG_MT="$(FFMPEG_MT)" \
		docker buildx build \
			--build-arg EXTRA_CFLAGS \
			--build-arg EXTRA_LDFLAGS \
			--build-arg FFMPEG_MT \
			--build-arg FFMPEG_ST \
			-f Dockerfile.prod \
			-o ./packages/core-mp3 \
			$(EXTRA_ARGS) \
			.

build-mp3-st:
	make build-mp3 \
		FFMPEG_ST=yes

dev-mp3:
	make build-mp3-st EXTRA_CFLAGS="$(DEV_CFLAGS)" EXTRA_ARGS="$(DEV_ARGS)"

prd-mp3:
	make build-mp3-st EXTRA_CFLAGS="$(PROD_CFLAGS)"

# ============================================================
# Node.js Server Build Targets (with NODERAWFS for native FS)
# ============================================================
.PHONY: build-mp3-node
build-mp3-node:
	rm -rf ./packages/core-mp3-node/dist
	EXTRA_CFLAGS="$(EXTRA_CFLAGS)" \
	EXTRA_LDFLAGS="$(EXTRA_LDFLAGS)" \
	FFMPEG_ST="$(FFMPEG_ST)" \
	FFMPEG_MT="$(FFMPEG_MT)" \
		docker buildx build \
			--build-arg EXTRA_CFLAGS \
			--build-arg EXTRA_LDFLAGS \
			--build-arg FFMPEG_MT \
			--build-arg FFMPEG_ST \
			--build-arg FFMPEG_BUILD_SCRIPT=ffmpeg-wasm-mp3-node.sh \
			-f Dockerfile.prod \
			-o ./packages/core-mp3-node \
			$(EXTRA_ARGS) \
			.

build-mp3-node-st:
	make build-mp3-node \
		FFMPEG_ST=yes

dev-mp3-node:
	make build-mp3-node-st EXTRA_CFLAGS="$(DEV_CFLAGS)" EXTRA_ARGS="$(DEV_ARGS)"

prd-mp3-node:
	make build-mp3-node-st EXTRA_CFLAGS="$(PROD_CFLAGS)"

# Build both worker and node variants
.PHONY: build-mp3-all
build-mp3-all: prd-mp3 prd-mp3-node
