jest.mock('../config.json', () => ({
    "$schema": "./config_schema.json",
    "JWTSecret": "a-string-secret-at-least-256-bits-long",
    "userIDField": "sub",
    "clientInfo": {
        "info": "This is some client info"
    },
    "identityServiceMetadata": {
        "metadata": "This is some identity service metadata"
    },
    "claims": {
        "role": {
            "admin": "all",
            "standardUser": "onedoc",
            "Admin": "all"
        }
    },
    "permissions": {
        "all": {
            "read": "*",
            "write": "*",
            "remoteQuery": false
        },
        "onedoc": {
            "read": {
                "collection1": ["_id == '12345'"]
            },
            "write": {
                "collection1": []
            },
            "remoteQuery": false
        }
    }
}));

const { AuthWebhook } = require('../index');

describe('AuthWebhook', () => {
    let authWebhook;

    beforeEach(() => {
        // Mock date
        jest.spyOn(Date, 'now').mockImplementation(() => Date.UTC(2030, 6, 30, 12, 0, 0));
        authWebhook = new AuthWebhook();
    });

    describe('createResponse', () => {
        test('should create a response with user permissions - User 1', () => {
            const decoded = { "role": 'standardUser', "sub": "User1", "exp": Math.floor(Date.now() / 1000) + 60 };
            const payload = authWebhook.createResponse(decoded);
            expect(payload).toEqual({
                "authenticated": true,
                "userID": "User1",
                "expirationSeconds": 60,
                "clientInfo": {
                    "info": "This is some client info"
                },
                "identityServiceMetadata": {
                    "metadata": "This is some identity service metadata"
                },
                "permissions": {
                    "read": {
                        "everything": false,
                        "queriesByCollection": {
                            "collection1": ["_id == '12345'"]
                        }
                    },
                    "write": {
                        "everything": false,
                        "queriesByCollection": {
                            "collection1": []
                        }
                    },
                    "remoteQuery": false
                }
            });
        });

        test('should create a response with user permissions - User 2', () => {
            const decoded = { "role": 'admin', "sub": "User2", "exp": Math.floor(Date.now() / 1000) + 60 };
            const payload = authWebhook.createResponse(decoded);
            expect(payload).toEqual({
                "authenticated": true,
                "userID": "User2",
                "expirationSeconds": 60,
                "clientInfo": {
                    "info": "This is some client info"
                },
                "identityServiceMetadata": {
                    "metadata": "This is some identity service metadata"
                },
                "permissions": {
                    "read": {
                        "everything": true,
                        "queriesByCollection": {}
                    },
                    "write": {
                        "everything": true,
                        "queriesByCollection": {}
                    },
                    "remoteQuery": false
                }

            });
        });

        test('should handle users with no permissions', () => {
            const decoded = { "sub": 'UnknownUser', "exp": Math.floor(Date.now() / 1000) + 60 };
            const payload = authWebhook.createResponse(decoded);
            expect(payload).toEqual({
                authenticated: false
            });
        });

        test('should handle the case where a permission set is not defined', () => {
            const decoded = { "role": 'nonExistentRole', "sub": "User3", "exp": Math.floor(Date.now() / 1000) + 60 };
            const payload = authWebhook.createResponse(decoded);
            expect(payload).toEqual({
                authenticated: false
            });
        });
    });

    describe('extractConfigField - info in config', () => {
        test('should extract clientInfo from decoded JWT', () => {
            const decoded = { clientInfo: { info: "Client Info" } };
            const fieldName = 'clientInfo';
            const result = authWebhook.extractConfigField(decoded, fieldName);
            expect(result).toEqual({ info: "This is some client info" });
        });

        test('should extract identityServiceMetadata from decoded JWT', () => {
            const decoded = { identityServiceMetadata: { metadata: "Service Metadata" } };
            const fieldName = 'identityServiceMetadata';
            const result = authWebhook.extractConfigField(decoded, fieldName);
            expect(result).toEqual({ metadata: "This is some identity service metadata" });
        });

        test('should return empty object for non-existent field', () => {
            const decoded = {};
            const fieldName = 'nonExistentField';
            const result = authWebhook.extractConfigField(decoded, fieldName);
            expect(result).toEqual({});
        });

        test('should handle array config fields', () => {
            authWebhook.config.clientInfo = ['info', 'info.info2'];
            const decoded = { info: { info2: "Client Info 2" } };
            const fieldName = 'clientInfo';
            const result = authWebhook.extractConfigField(decoded, fieldName);
            expect(result).toEqual({ info: { info2: "Client Info 2" }, info2: "Client Info 2" });
        });
    });

    describe('decodeJWT', () => {
        test('should decode a valid JWT with no secret', () => {
            const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
            authWebhook.config.JWTSecret = null;
            const decoded = authWebhook.decodeJWT(jwt);
            expect(decoded).toEqual({ sub: '1234567890', name: 'John Doe', admin: true, iat: 1516239022 });
        });

        test('should decode a valid JWT with a secret', () => {
            authWebhook.config.JWTSecret = 'a-string-secret-at-least-256-bits-long';
            const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
            const decoded = authWebhook.decodeJWT(jwt);
            expect(decoded).toEqual({ sub: '1234567890', name: 'John Doe', admin: true, iat: 1516239022 });
        });

        test('should throw an error for an invalid JWT', () => {
            const jwt = 'invalid.jwt.token';
            authWebhook.config.JWTSecret = null;
            expect(() => authWebhook.decodeJWT(jwt)).toThrow('Invalid token');
        });
    });

    describe('calculateExpiration', () => {
        test('should return the correct expiration time based on decoded JWT', () => {
            const decoded = { exp: Math.floor(Date.now() / 1000) + 3600 };
            const expiration = authWebhook.calculateExpiration(decoded);
            expect(expiration).toBe(3600); // Allow a small margin of error
        });
    });

    describe('getNestedValue', () => {
        test('should return the value at the specified path', () => {
            const obj = { a: { b: { c: 'value' } } };
            const path = 'a.b.c';
            const value = authWebhook.getNestedValue(obj, path);
            expect(value).toBe('value');
        });

        test('should return undefined for non-existent paths', () => {
            const obj = { a: { b: { c: 'value' } } };
            const path = 'a.b.d';
            const value = authWebhook.getNestedValue(obj, path);
            expect(value).toBeUndefined();
        });

        test('should handle paths with dots in keys', () => {
            const obj = { 'a.b': { c: 'value' } };
            const path = 'a.b.c';
            const value = authWebhook.getNestedValue(obj, path);
            expect(value).toBe('value'); // Should not find 'c' under 'a.b'
        });
    });

    describe('start', () => {
        test('should start with then environment variable PORT if set', () => {
            process.env.PORT = 4000;
            const listenSpy = jest.spyOn(authWebhook.app, 'listen').mockImplementation(() => { });
            authWebhook.start();
            expect(listenSpy).toHaveBeenCalledWith("4000", expect.any(Function));
            delete process.env.PORT; // Clean up after test
        });
    });
})

