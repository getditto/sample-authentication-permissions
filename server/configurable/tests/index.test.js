jest.mock('../config.json', () => ({
    "$schema": "./config_schema.json",
    "userIDField": "http://mydittoapp.com/userID",
    "defaultExpirationSeconds": 3600,
    "JWTSecret": "a-string-secret-at-least-256-bits-long",
    "clientInfo": {
        "info": "This is some client info"
    },
    "identityServiceMetadata": {
        "metadata": "This is some identity service metadata"
    },
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

describe('AuthWebhook', () => {
    let authWebhook;

    beforeEach(() => {
        authWebhook = new AuthWebhook();
    });


    describe('buildClaimsMap', () => {
        test('should correctly build permissions map from current config.json', () => {
            expect(authWebhook.permissionsMap).toEqual({
                "User1": {
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
                },
                "User2": {
                    "read": {
                        "everything": true,
                        "queriesByCollection": {}
                    },
                    "write": {
                        "everything": true,
                        "queriesByCollection": {}
                    },
                    "remoteQuery": false
                },
                "AdminUser": {
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
            }
            );
        });
    });

    describe('createPayload', () => {
        test('should create a payload with user permissions - User 1', () => {
            const decoded = { "http://mydittoapp.com/userID": 'User1' };
            const payload = authWebhook.createPayload(decoded);
            expect(payload).toEqual({
                "authenticated": true,
                "userID": "User1",
                "expirationSeconds": 3600,
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

        test('should create a payload with user permissions - User 2', () => {
            const decoded = { "http://mydittoapp.com/userID": 'User2' };
            const payload = authWebhook.createPayload(decoded);
            expect(payload).toEqual({
                "authenticated": true,
                "userID": "User2",
                "expirationSeconds": 3600,
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
            const decoded = { "http://mydittoapp.com/userID": 'UnknownUser' };
            const payload = authWebhook.createPayload(decoded);
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

    describe('handleAuth', () => {
        beforeEach(() => {
            // Stub out the decodeJWT and createPayload methods
            authWebhook.decodeJWT = jest.fn().mockImplementation(token => {
                return { sub: 'User1', exp: Math.floor(Date.now() / 1000) + 3600 };
            });
            authWebhook.createPayload = jest.fn().mockImplementation(decoded => {
                return {
                    authenticated: true,
                    userID: decoded.sub,
                    expirationSeconds: 3600,
                    permissions: authWebhook.permissionsMap[decoded.sub] || {},
                    clientInfo: authWebhook.config.clientInfo,
                    identityServiceMetadata: authWebhook.config.identityServiceMetadata
                };
            });
        });

        test('should return an error if token is missing', () => {
            const req = { body: {} };
            expect(() => authWebhook.handleAuth(req)).toThrow('Token is required');
        });

        test('should return an error if the token has expired', () => {
            const req = { body: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJVc2VyMSIsImV4cCI6MTYwMDAwMDAwMH0.abc123' } };
            jest.spyOn(Date, 'now').mockImplementationOnce(() => 1600000000000);
            expect(() => authWebhook.handleAuth(req)).toThrow('Token has expired');
        });

        test('should return authentication payload for a valid token', () => {
            const req = { body: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJVc2VyMSIsImV4cCI6MTYwMDAwMDAwMH0.abc123' } };
            const payload = authWebhook.handleAuth(req);
            expect(payload).toHaveProperty('authenticated', true);
            expect(payload).toHaveProperty('userID', 'User1');
            expect(payload).toHaveProperty('expirationSeconds', 3600);
            expect(payload).toHaveProperty('permissions');
        });
    });

    describe('calculateExpiration', () => {
        test('should return the correct expiration time based on decoded JWT', () => {
            const decoded = { exp: Math.floor(Date.now() / 1000) + 3600 };
            const expiration = authWebhook.calculateExpiration(decoded);
            expect(expiration).toBe(3600);
        });

        test('should return default expiration time if no exp field is present', () => {
            const decoded = {};
            const expiration = authWebhook.calculateExpiration(decoded);
            expect(expiration).toBe(3600); // Default value
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
})

