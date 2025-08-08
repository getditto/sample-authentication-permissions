# Configurable Authentication Server

A configurable authentication server. It allows you to define user roles and permissions in a JSON configuration file, which the server uses to authenticate users and provide them with the appropriate permissions.

## Ditto Authentication
![Ditto Authentication Flow](README_resources/auth_flow.png)
Above shows the authentication flow for the Ditto network for apps using the Online with Authentication mode. The flow is as follows:
1. The edge device sends a request to an authentication mechanis of your choice, such as Auth0.
2. On a successful login this mechanism returns a token, such as a JWT, to the edge device.
3. The edge device then sends a login request containing this token to the Ditto server.
4. The Ditto server then sends a request to a specified webhook configured in the Ditto portal.
5. The webhook then processes the token and returns the relevant permissions for the user back to the Ditto server which in turn returns Ditto credentials to the edge device.

## Quick Start

Note: This server is designed to be used with a JWT-based identity service.

### Setup

1. Install Node requirements:
```bash
npm install
```

2. Copy over the example config, `config.json.example` to `config.json`:
```bash
cp config.json.example config.json
```

3. Edit `config.json` for your requirements following the schema provided in `config_schema.json`.

### Running the Server

```bash
# Start with default port (3000)
node server.js

# Or start with custom port
PORT=4000 node server.js
```

#### Running locally

In order to run the webhook locally you need to expose your local machine to the internet via an https connection. For testing and demo purposes this can be done using tools like [ngrok](https://ngrok.com/docs) by running the following command after installing ngrok, replacing `<port_number>` with the port your server is running on:

```bash
ngrok http <port_number>
```

This will provide you with a public https URL that you can use as the webhook URL in the Ditto portal.

## Configuration Reference

### Fields

- **`JWTSecret`** (string, optional): The secret used to sign the JWTs used by the server to verify the JWT, if none is provided no verification is performed.

- **`userIDField`** (string): A field in the JWT that contains a user ID in the form `path.to.userID` to be used in the Ditto system.

- **`expirationField`** (object, optional): This is a field describing how the expiration time is stated in the JWT. It contains two fields:
  - **`field`** (string): The path to the expiration time in the JWT. If none is provided, the JWT's `exp` field will be used.
  - **`format`** (string): The format of the expiration time. If none is provided the number of seconds since the unix epoch is used.
  
  Example:
  ```json
  {
      "field": "expirationTime",
      "format": "DD-MM-YYYY HH:mm:ss"
  }
  ```

- **`clientInfo`** (object | array, optional): Information to be passed through to the response. Can be a single JSON object which will be passed through as-is, or an array of paths to fields in the JWT that should be included in the response.
- **`identityServiceMetadata`** (object | array, optional): Metadata about the identity service. Can be a single JSON object which will be passed through as-is, or an array of paths to fields in the JWT that should be included in the response.
- **`claims`** (object): A list of claims and their potential values that can be used to determine the permissions for the user.

  Example:
  ```json
  {
      "claims": {
        # The JWT contains a field 'roles' which can have the values 'admin' or 'user'.
        # The admin role gives a permission set called 'all' the user role gives a permission set called 'standard'.
        "roles": {
          "admin": "all",
          "user": "standard"
        }
      }
  }
  ```
- **`permissions`** (object): A list of permission sets that can be assigned to users based on their claims. Each permission set contains a `read` and `write` field, which can be either a wildcard `*` to allow all read/write operations, or an object with specific rules for each collection.

  Example:
  ```json
  {
    "permissions": {
          "all": {
              "read": "*",
              "write": "*"
          },
          "standard": {
              "read": {
                  "tasks": ["_id == '68935a33005a7e6e00e1b4aa'"]
              },
              "write": {
                  "tasks": ["_id == '68935a33005a7e6e00e1b4aa'"]
              }
          }
      }
  }
  ```
  For more information on permissions see the [Authorizing Users](https://docs.ditto.live/sdk/latest/auth-and-authorization/data-authorization) section in the docs.

More details on the configuration schema can be found in `config_schema.json` and an example configuration is provided in `config.json.example`.

# Example with the quickstart app
Here we provide an example of using the [quickstart app](https://github.com/getditto/quickstart) along with the configurable authentication webhook.

## Example configuration
In this example we have three potential user roles: `admin`, `standardUser`, and `guest`. The `admin` role has full permissions, while the `standardUser` and `guest` roles have limited permissions to read and write only one specific task. It is also the case that the expiration time is expected to be provided in the JWT in the `exp` field as a unix timestamp.

```json
{
    "$schema": "./config_schema.json",
    "userIDField": "sub",
    "expirationField": {
        "field": "exp",
        "format": "unix"
    },
    "claims": {
        "roles": {
            "admin": "all",
            "standardUser": "standard",
            "guest": "standard"
        }
    },
    "permissions": {
        "all": {
            "read": "*",
            "write": "*"
        },
        "standard": {
            "read": {
                "tasks": ["_id == '68935a33005a7e6e00e1b4aa'"]
            },
            "write": {
                "tasks": ["_id == '68935a33005a7e6e00e1b4aa'"]
            }
        }
    }
}
```
