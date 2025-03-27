# CMake build type: Debug, Release, RelWithDebInfo
BUILD_TYPE ?= Debug

# Utility paths
CMAKE ?= cmake
CTEST ?= ctest
CLANG_TIDY ?= clang-tidy
CLANG_FORMAT ?= clang-format
CURL ?= curl
TAR ?= tar

BUILD_DIR = build
XCODE_BUILD_DIR = build-xcode

CPP_SRC_FILES = $(shell find src test -type f \( -name '*.cpp' -o -name '*.h' -o -name '*.hpp' \) ! -name 'doctest.h')

# Ditto C++ SDK download location
DITTO_SDK_URL ?= https://software.ditto.live/cpp-linux-x86_64/Ditto/4.9.4/dist/Ditto.tar.gz
#DITTO_SDK_URL ?= https://software.ditto.live/cpp-linux-aarch64/Ditto/4.9.4/dist/Ditto.tar.gz

# Location of local Ditto C++ SDK build directory
SDKBUILD_DIR ?= ~/getditto/ditto/cpp
SDKBUILD_ANDROID_DIR ?= ~/getditto/ditto/android/dittocpp/build/outputs/aar

# The "help" target will display all targets marked with a "##" comment.
.PHONY: help
help: MAKEFILE_FMT = "  \033[36m%-34s\033[0m%s\n"
help: ## (default) Displays this message
	@echo "Makefile"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z0-9_-]*:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?##"}; {printf $(MAKEFILE_FMT), $$1, $$2}'
	@echo ""
	@echo "Parameters:"
	@grep -E '^[A-Z0-9_-]* ?\?=.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = " ?\\?=.*?##"}; {printf $(MAKEFILE_FMT), $$1, $$2}'

.PHONY: build
build: ## Generates all targets
	$(CMAKE) -B $(BUILD_DIR) . -DCMAKE_BUILD_TYPE=$(BUILD_TYPE) -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
	$(CMAKE) --build $(BUILD_DIR) --parallel

.PHONY: run
run: build ## Builds and runs the main executable
	$(BUILD_DIR)/dittocppauth --help-all

.PHONY: run-online-playground
run-online-playground: build ## Builds and runs the online-playground subcommand
	# Note: env variables must be set for required parameters
	${BUILD_DIR}/dittocppauth online-playground

.PHONY: run-offline-playground
run-offline-playground: build ## Builds and runs the offline-playground subcommand
	# Note: env variables must be set for required parameters
	${BUILD_DIR}/dittocppauth offline-playground

.PHONY: run-online-with-authentication
run-online-with-authentication: build ## Builds and runs the online-with-authentication subcommand
	# Note: env variables must be set for required parameters
	${BUILD_DIR}/dittocppauth online-with-authentication

.PHONY: xcode
xcode: ## Generates an Xcode project in the build-xcode directory
	mkdir -p $(XCODE_BUILD_DIR)
	cd $(XCODE_BUILD_DIR) && $(CMAKE) .. -G Xcode

.PHONY: format
format: ## Apply clang-format to all .cpp and .h files
	$(CLANG_FORMAT) -i $(CPP_SRC_FILES)

.PHONY: lint
lint: build ## Runs clang-format -n and clang-tidy on all .cpp and .h files
	$(CLANG_FORMAT) --dry-run --Werror $(CPP_SRC_FILES)
	$(CLANG_TIDY) -p $(BUILD_DIR) $(CPP_SRC_FILES)

.PHONY: download-sdk
download-sdk: ## Downloads the Ditto C++ SDK
	mkdir -p sdk
	cd sdk && $(CURL) -O $(DITTO_SDK_URL) && $(TAR) xvfz Ditto.tar.gz

.PHONY: copy-sdk
copy-sdk: ## Copies Ditto.h and libditto.a from local SDK build
	mkdir -p sdk
	cp $(SDKBUILD_DIR)/include/Ditto.h sdk/Ditto.h
	cp $(SDKBUILD_DIR)/build/libditto.a sdk/libditto.a

.PHONY: clean
clean: ## Removes all generated files
	- rm -rf $(BUILD_DIR)
	- rm -rf $(XCODE_BUILD_DIR)

