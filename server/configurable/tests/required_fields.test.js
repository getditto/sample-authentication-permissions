jest.mock('../config.json', () => ({
    "$schema": "./config_schema.json",
    "defaultExpirationSeconds": 3600,
    "JWTSecret": "a-string-secret-at-least-256-bits-long",
    "clientInfo": {
        "info": "This is some client info"
    },
    "identityServiceMetadata": {
        "metadata": "This is some identity service metadata"
    }
}));

const { AuthWebhook } = require('../index');

describe('AuthWebhook - requried fields', () => {
    // In the schema we require the roles field to be present, so we need to test that the class throws an error if it is not present.
    let authWebhook;

    test('should throw an error if required fields are not defined in the config', () => {
        expect(() => {
            authWebhook = new AuthWebhook();
        }).toThrow('The config is invalid.');
    });
});