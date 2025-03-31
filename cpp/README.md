# Ditto C++ Authentication Sample

This is a simple command-line-interface application that demonstrates how to
implement various authentication schemes using the Ditto C++ SDK.

For more information about Ditto's authentication and authorization mechanisms,
refer to the documentation:

- <https://docs.ditto.live/key-concepts/authentication-and-authorization>
- <https://docs.ditto.live/sdk/latest/auth-and-authorization/cloud-authentication>


## Usage

```
dittocppauth [OPTIONS] SUBCOMMAND


OPTIONS:
  -h,               --help                                  Print this help message and exit
                    --help-all                              Expand all help
  -a,               --app-id TEXT (Env:DITTOCPPAUTH_APP_ID)
  -p,               --persistence-directory TEXT [/tmp/ditto/dittocpppauth]  (Env:DITTOCPPAUTH_PERSISTENCE_DIR)
  -l,               --log-level LEVEL                       error, warning, info, debug, or verbose
                    --export-logs PATH                      Export collected logs to this path
  -n,               --device-name TEXT [dittocppauth]  (Env:DITTOCPPAUTH_DEVICE_NAME)
                                                            Device name

SUBCOMMANDS:
offline-playground
  P2P with no cloud connection


OPTIONS:
  -t,               --offline-only-license-token TEXT (Env:DITTOCPPAUTH_OFFLINE_ONLY_LICENSE_TOKEN)


online-playground
  Low-security cloud environment for development


OPTIONS:
  -t,               --online-playground-token TEXT REQUIRED (Env:DITTOCPPAUTH_PLAYGROUND_TOKEN)
                                                            Online playground token
                    --cloud-sync, --no-cloud_sync{false} (Env:DITTOCPPAUTH_CLOUD_SYNC)
                                                            Enable Ditto cloud sync
                    --custom-auth-url TEXT (Env:DITTOCPPAUTH_CUSTOM_AUTH_URL)
                    --websocket-url TEXT (Env:DITTOCPPAUTH_WEBSOCKET_URL)
                                                            WebSocket URL


online-with-authentication
  Production authentication with Ditto cloud or on-premises server


OPTIONS:
                    --provider TEXT REQUIRED (Env:DITTOCPPAUTH_PROVIDER)
  -t,               --online-token TEXT (Env:DITTOCPPAUTH_ONLINE_TOKEN)
                                                            Authentication token
                    --username TEXT (Env:DITTOCPPAUTH_USERNAME)
                                                            User name
                    --password TEXT (Env:DITTOCPPAUTH_PASSWORD)
                                                            Password
                    --cloud-sync, --no-cloud_sync{false} (Env:DITTOCPPAUTH_CLOUD_SYNC)
                                                            Enable Ditto cloud sync
                    --custom-auth-url TEXT (Env:DITTOCPPAUTH_CUSTOM_AUTH_URL)
                                                            Custom authentication URL


shared-key
  Simple shared-secret authentication


OPTIONS:
  -k,               --key TEXT (Env:DITTOCPPAUTH_SHARED_KEY)
                                                            Base-64 encoded DER private key


manual
  Accepts base64-encode certificate bundle


OPTIONS:
  -c,               --certificate-config TEXT (Env:DITTOCPPAUTH_CERTIFICATE_CONFIG)
                                                            Base64-encoded certificate bundle


print-sdk-version
  Print the Ditto C++ SDK version string
```

### Environment Variables

Most command-line options can alternatively be specified by setting environment variables.

| Option                        | Environment variable                      |
| ----------------------------- | ----------------------------------------- |
| `--app-id`                    | `DITTOCPPAUTH_APP_ID`                     |
| `--certificate-config`        | `DITTOCPPAUTH_CERTIFICATE_CONFIG`         |
| `--cloud-sync`                | `DITTOCPPAUTH_CLOUD_SYNC`                 |
| `--custom-auth-url`           | `DITTOCPPAUTH_CUSTOM_AUTH_URL`            |
| `--device-name`               | `DITTOCPPAUTH_DEVICE_NAME`                |
| `--export-logs`               | `DITTOCPPAUTH_EXPORT_LOGS_PATH`           |
| `--log-level`                 | `DITTOCPPAUTH_LOG_LEVEL`                  |
| `--key`                       | `DITTOCPPAUTH_SHARED_KEY`                 |
| `--offline-only-access-token` | `DITTOCPPAUTH_OFFLINE_ONLY_LICENSE_TOKEN` |
| `--online-playground-token`   | `DITTOCPPAUTH_PLAYGROUND_TOKEN`           |
| `--online-token`              | `DITTOCPPAUTH_ONLINE_TOKEN`               |
| `--password`                  | `DITTOCPPAUTH_PASSWORD`                   |
| `--persistence-directory`     | `DITTOCPPAUTH_PERSISTENCE_DIR`            |
| `--provider`                  | `DITTOCPPAUTH_PROVIDER`                   |
| `--username`                  | `DITTOCPPAUTH_USERNAME`                   |
| `--websocket-url`             | `DITTOCPPAUTH_WEBSOCKET_URL`              |

### Usage Examples

Use your own values for placeholders like `<APPID>` and `<TOKEN>` in the
examples below.

#### Online Playground

```
dittocppauth --app-id <APPID> online-playground --token <TOKEN> --cloud-sync
```

#### Online with Authentication

```
dittocppauth --app-id <APPID> online-with-authentication \
  --provider <PROVIDER> --online-token <TOKEN> --custom-auth-url <URL>
```

#### Get Help for a Subcommand

```
dittocppauth online-with-authentication --help
```

## Prerequisites for Building the Application

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

Note the generated app-id value and other associated authentication parameters
for use when running `dittocppauth`.


## Building the Project

```sh
make build
```

## Running the Application

The application will be built in the `build` directory.  Run it with this command:

```sh
./build/dittocppauth
```

Running it with no parameters will cause online help to be shown.  See the
**Usage** section above for details about command-line parameters.