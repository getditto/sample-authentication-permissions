# Ditto C++ Authentication Sample

This is a simple command-line-interface application that demonstrates how to
implement various authentication schemes using the Ditto C++ SDK.

```
dittocppauth [OPTIONS] SUBCOMMAND


OPTIONS:
  -h,               --help                                  Print this help message and exit
                    --help-all                              Expand all help
  -a,               --app-id TEXT REQUIRED (Env:DITTO_APP_ID)
  -p,               --persistence-directory TEXT [/tmp/ditto/dittocpppauth]  (Env:DITTO_PERSISTENCE_DIR)
  -l,               --log-level LEVEL                       error, warning, info, debug, or verbose
                    --export-logs PATH                      Export collected logs to this path
  -n,               --name TEXT [dittocppauth]              Device name

SUBCOMMANDS:
online-playground

OPTIONS:
  -t,               --token TEXT REQUIRED (Env:DITTO_PLAYGROUND_TOKEN)
                                                            Online playground token
                    --cloud-sync, --no-cloud_sync{false}    Enable Ditto cloud sync
                    --custom-auth-url TEXT (Env:DITTO_CUSTOM_AUTH_URL)
```

## Example Usage

Use your own values for placeholders like `<APPID>` and `<TOKEN>`.

```
build/dittocppauth --app-id <APPID> online-playground --token <TOKEN> --cloud-sync
```

## Prerequisites

- CMake 3.14 or later
- Make
- A C++ compiler (e.g. GCC, Clang, MSVC)


## Setting up the Ditto SDK

Download or build the Ditto C++ SDK for your platform.  Copy or move the
`Ditto.h` and `libditto.a` files to the `sdk` directory in this project.

You can run `make download-sdk` to download the SDK for Linux x86_64.  You can
modify the value of the `DITTO_SDK_URL` variable in the `Makefile` to download
the SDK for a different platform.

If you have built the SDK locally from source, you can run `make copy-sdk` to
copy the files from the build directories to the correct location.


## Setting up a Ditto Application

Create a new Ditto application on the
[Ditto Developer Console](https://developer.ditto.live/).

Copy the application ID and online playground token to the values of
`DITTO_APP_ID` and `DITTO_ONLINE_PLAYGROUND_TOKEN` in the `src/main.cpp` file.


## Building the Project

```sh
make build
```


## Running Unit Tests

```sh
make test
```


## Running the Application

The application will be built in the `build` directory.  Run it with this command:

```sh
./build/dittocppauth
```
