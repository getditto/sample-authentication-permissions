cmake_minimum_required(VERSION 3.14)

project(dittocppauth
  VERSION 1.0
  LANGUAGES CXX
  DESCRIPTION "Ditto Application"
)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_CXX_EXTENSIONS OFF)

# We may have a build of the Ditto SDK with Address Sanitizer enabled, so we
# need compatible build flags.
if(CMAKE_CXX_COMPILER_ID STREQUAL "Clang" OR CMAKE_CXX_COMPILER_ID STREQUAL "AppleClang")
  add_compile_options(-Wno-deprecated-declarations)

  # Enable Address Sanitizer
  add_compile_options(-fsanitize=address -fno-omit-frame-pointer)
  add_link_options(-fsanitize=address)
elseif (CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
  add_compile_options(-Wno-deprecated-declarations)

  # Enable Address Sanitizer
  add_compile_options(-fsanitize=address -fno-omit-frame-pointer)
  add_link_options(-fsanitize=address)
endif()

# On macOS, this will prevent "ld: warning: __eh_frame section too large (max
# 16MB) to encode dwarf unwind offsets in compact unwind table, performance of
# exception handling might be affected" warnings
if(APPLE)
    add_link_options("$<$<LINK_LANGUAGE:CXX>:-Wl,-no_compact_unwind>")
endif()


# Main target

# Compile all the .cpp files in the src directory to build the main target
file(GLOB_RECURSE SOURCES "src/*.cpp")
add_executable(dittocppauth ${SOURCES})

target_include_directories(dittocppauth PRIVATE sdk)
target_link_libraries(dittocppauth PRIVATE ${CMAKE_SOURCE_DIR}/sdk/libditto.a)

