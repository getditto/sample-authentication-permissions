// Mock the call to get the config file to use one defined above
jest.mock('../config.json', () => ({
    "$schema": "./config_schema.json",
    "roles": {
        "cabin_crew": {
            "members": [
                "User1",
                "User2"
            ],
            "permissions": {
                "read": {
                    "collection1": ["_id == '12345'"]
                },
                "write": {
                    "collection1": []
                },
                "remoteQuery": false
            }
        },
        "admin": {
            "members": [
                "AdminUser",
                "User2"
            ],
            "permissions": {
                "read": "*",
                "write": "*",
                "remoteQuery": false
            }
        }
    }
}));

const { AuthWebhook } = require('../index');

describe('AuthWebhook - partial config', () => {
    // In the schema we allow certain fields to be optional with a default value whilst the others are required.
    // So we need to test that the defaults are applied correctly and if the lack of a required field throws an error.
    let authWebhook;

    beforeEach(() => {
        authWebhook = new AuthWebhook();
    });

    test('should have a default defaultExpirationSeconds', () => {
        expect(authWebhook.config.defaultExpirationSeconds).toBe(3600);
    });
});
