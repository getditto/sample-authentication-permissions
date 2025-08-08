afterEach(() => {
    jest.resetModules();
});

const { AuthWebhook } = require('../index');

describe('AuthWebhook - required fields', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.mock('../config.json', () => ({
            "$schema": "./config_schema.json",
            "userIDField": "sub",
            "permissions": {
                "all": {
                    "read": "*",
                    "write": "*"
                }
            }
        }), { virtual: true });
    });

    describe('Missing claims field', () => {
        test('should throw an error if claims field is not defined in the config', () => {
            expect(() => {
                new AuthWebhook();
            }).toThrow('Missing config fields: claims');
        });
    });
});

describe('AuthWebhook - required fields', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.mock('../config.json', () => ({
            "$schema": "./config_schema.json",
            "userIDField": "sub",
            "claims": {
                "admin": {
                    "members": ["user1"],
                    "permissions": "all"
                }
            }
        }), { virtual: true });
    });

    describe('Missing permissions field', () => {
        test('should throw an error if permissions field is not defined in the config', () => {
            const { AuthWebhook } = require('../index');
            expect(() => {
                new AuthWebhook();
            }).toThrow('Missing config fields: permissions');
        });
    });
});

describe('AuthWebhook - required fields', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.mock('../config.json', () => ({
            "$schema": "./config_schema.json",
            "claims": {
                "admin": {
                    "members": ["user1"],
                    "permissions": "all"
                }
            },
            "permissions": {
                "all": {
                    "read": "*",
                    "write": "*"
                }
            }
        }), { virtual: true });
    });

    describe('Missing permissions field', () => {
        test('should throw an error if userID field is not defined in the config', () => {
            const { AuthWebhook } = require('../index');
            expect(() => {
                new AuthWebhook();
            }).toThrow('Missing config fields: userIDField');
        });
    });
});