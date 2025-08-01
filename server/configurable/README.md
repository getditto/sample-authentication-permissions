# Configurable Authentication Server

A configurable authentication server. It translates JWTs into Ditto authentication responses using a JSON configuration file that describes the structure of the JWT and the permissions claims should map to.

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

A schema for the configuration is provided as well as an example.

### Core Settings

- **`userIDField`** (string, default: "sub"): JWT field to extract user ID from
- **`defaultExpirationSeconds`** (number, default: 3600): Default token expiration in seconds, to be used if no exp field is provided in the JWT
- **`JWTSecret`** (string, optional): Secret for JWT signature verification

### Permission Mapping

Permissions use the format `path.to.claim.value` where:
- `path.to.claim` is the dot-notation path to the JWT field
- `value` is the expected value that grants the permission

**If no permissions are specified in the `config.json` file all requests will be given complete read and write access.**

#### Permission Objects

```json
{
  "read": "*" | { "collectionName": ["query1", "query2"] },
  "write": "*" | { "collectionName": ["query1"] },
  "remoteQuery": true | false
}
```

- `"*"` grants full access
- Object format grants collection-specific access with a permission query on the `_id` field of a document. For more information see [Authorizing Users](https://docs.ditto.live/sdk/latest/auth-and-authorization/data-authorization)
- JWTs containing multiple claims with different permissions have these merged so users receive the highest level of permissions of all the present claims.

### Optional Fields

- **`clientInfo`**: Static object or JWT path for client metadata, this data is copied into the response
- **`identityServiceMetadata`**: Static object or JWT path for identity service data, this data is copied into the response

## JWT Processing

### Without Signature Verification
If no `JWTSecret` is provided, tokens are decoded without verification (useful for development).

### With Signature Verification
When `JWTSecret` is configured, JWT signatures are validated before processing.

### Expiration Handling
- Uses JWT `exp` field if present the `expirationSeconds` field of the response will be the number of seconds between the `exp` time stamp and the current time. If no `exp` field is present in the JWT the `defaultExpirationSeconds` specified in the config will be used
- Expired tokens return 401 error

