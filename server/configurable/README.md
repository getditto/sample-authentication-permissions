# Configurable Authentication Server

A configurable authentication server. It allows you to define user roles and permissions in a JSON configuration file, which the server uses to authenticate users and provide them with the appropriate permissions.

## Quick Start

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

## Endpoints
- **`/`** - Health check endpoint, returns server status and timestamp
- **`/auth`** - Authentication endpoint, returns a Ditto-formatted authentication response with permissions. This is the endpoint that should be specified as the webhook in the Ditto portal.

## Configuration Reference

### Fields

- **`JWTSecret`** (string, optional): The secret used to sign the JWTs used by the server to verify the JWT, if none is provided no verification is performed.
- **`userIDField`** (string, optional): The field in the JWT that contains the user ID in the form `path.to.userID`, if none is provided the `sub` field in the JWT is used.
- **`defaultExpirationSeconds`** (int, optional): The default expiration time for the JWT in seconds, will be used if no `exp` field is present in the JWT.
- **`clientInfo`** (object | array, optional): Information to be passed through to the response. Can be a single JSON object which will be passed through as-is, or an array of paths to fields in the JWT that should be included in the response.
- **`identityServiceMetadata`** (object | array, optional): Metadata about the identity service. Can be a single JSON object which will be passed through as-is, or an array of paths to fields in the JWT that should be included in the response.
- **`roles`** (object): A mapping of roles to permissions. Each role contains an array of userIDs and an object representing the permissions for that role.
  Permissions example:
  ```json
  {
      "read": "*", # Users can read all resources
      "write": {
        "collection1": ["_id == '12345'"] # Users can write to collection1 where the _id is '12345'
      },
      "remoteQuery": false
  }
  ```
  For more information on permissions see the [Authorizing Users](https://docs.ditto.live/sdk/latest/auth-and-authorization/data-authorization) section in the docs.

More details on the configuration schema can be found in `config_schema.json` and an example configuration is provided in `config.json.example`.
