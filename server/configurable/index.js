// Ditto configurable auth webhook implementation

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { jwtDecode } = require('jwt-decode');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');


// Config errors are thrown if something in the config is not valid
// This should only be thrown during initialization of the AuthWebhook class (not when the server is running)
class ConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigError';
    }
}

// Auth errors are thrown if something goes wrong during the authentication process
// When this happens we assume the user is unauthenticated
class AuthError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'AuthError';
        this.status = statusCode;
    }
}

class Config {
    constructor(config) {
        // Validate the configuration
        Config.validate(config);

        // Now we can assign values

        // These are the required fields
        this.claims = config.claims;
        this.permissions = config.permissions;
        this.userIDField = config.userIDField;

        // Optional fields
        this.expirationField = { // This will set the defaults if not provided
            field: 'exp',
            format: 'unix',
            ...config.expirationField
        };
        this.JWTSecret = config.JWTSecret || undefined;
        this.clientInfo = config.clientInfo || {};
        this.identityServiceMetadata = config.identityServiceMetadata || {};
    }

    /**
     * Validates the configuration checking for all required fields. 
     */
    static validate(config) {
        // Check for required fields
        const required = ['claims', 'permissions', 'userIDField'];
        const missing = required.filter(field => !config[field]);
        if (missing.length > 0) {
            throw new ConfigError(`Missing config fields: ${missing.join(', ')}`);
        }

        // Check all permissions sets are defined
        Object.entries(config.claims).forEach(([name, perm]) => {
            Object.entries(perm).forEach(([value, permissionSet]) => {
                if (!config.permissions[permissionSet]) {
                    throw new ConfigError(`Claim '${name}' with value '${value}' references undefined permission set '${permissionSet}'`);
                }
            });
        });

        // Check all permissions have read and write defined
        Object.entries(config.permissions).forEach(([name, perm]) => {
            if (!perm.read || !perm.write) {
                throw new ConfigError(`Permission set '${name}' must define read and write permissions`);
            }
        });
    }
}

class AuthWebhook {
    constructor() {
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());

        this.config = new Config(require('./config.json'));

        // Logging middleware
        this.app.use((req, _, next) => {
            console.log(`${req.method} ${req.url}`);
            next();
        });

        this.app.post('/auth', (req, res) => {
            try {
                const payload = this.handleAuth(req);
                res.status(200).json(payload);
            } catch (error) {
                // An error occured send back the user is unauthenticated
                res.status(401).json({ authenticated: false });
            }
        });
    }

    /**
     * Decodes a JWT
     */
    decodeJWT(token) {
        try {
            // If we have a secret, verify the token signature
            if (this.config.JWTSecret) {
                return jwt.verify(token, this.config.JWTSecret);
            } else {
                // If no secret, just decode without verification
                return jwtDecode(token);
            }
        } catch (error) {
            throw new AuthError('Invalid token', 400);
        }
    }

    /**
     * Gets permissions for the request based on the decoded JWT.
     * @param {Object} decoded - The decoded JWT payload.
     * @returns {Object} - The permissions object.
     */
    getPermissions(decoded) {
        let permissions = {};

        // Process each claim in the config
        for (const [claimPath, claimConfig] of Object.entries(this.config.claims)) {
            const claimValue = this.getNestedValue(decoded, claimPath);
            if (!claimValue) continue;

            // Normalize claimValue to always be an array for consistent processing
            const claimValues = Array.isArray(claimValue) ? claimValue : [claimValue];

            // Process each claim value (handles both single values and arrays)
            for (const value of claimValues) {
                // Get permission set name and configuration
                const permissionSetName = claimConfig[value];
                const permissionSet = this.config.permissions[permissionSetName];
                if (!permissionSet) continue;

                // Merge permissions
                permissions = {
                    read: this.mergePermissions(permissions.read || {}, this.convertPermissionFormat(permissionSet.read)),
                    write: this.mergePermissions(permissions.write || {}, this.convertPermissionFormat(permissionSet.write)),
                    remoteQuery: permissionSet.remoteQuery !== undefined ? permissionSet.remoteQuery : false
                };
            }
        }
        return permissions;
    }

    /**
     * Creates the response for the request based on the decoded JWT.
     * @param {Object} decoded - The decoded JWT payload.
     * @returns {Object} - The response to be returned.
     */
    createResponse(decoded) {
        const expirationSeconds = this.calculateExpiration(decoded);
        if (expirationSeconds <= 0) {
            throw new AuthError('Token has expired', 401);
        }

        const permissions = this.getPermissions(decoded);

        if (Object.keys(permissions).length === 0) {
            return { authenticated: false };
        }

        const response = {
            authenticated: true,
            userID: this.getNestedValue(decoded, this.config.userIDField),
            expirationSeconds,
            permissions
        };

        // Add optional fields
        ['clientInfo', 'identityServiceMetadata'].forEach(field => {
            if (this.config[field]) {
                const value = this.extractConfigField(decoded, field);
                // If the value is not empty, add it to the response
                if (Object.keys(value).length > 0) {
                    response[field] = value;
                }
            }
        });

        return response;
    }

    /**
     * Extracts a field from the config based on the decoded JWT.
     * @param {Object} decoded - The decoded JWT payload.
     * @param {string} fieldName - The name of the field to extract.
     * @returns {Object} - The extracted field value.
     */
    extractConfigField(decoded, fieldName) {
        let config = this.config[fieldName] || {};
        let userConfig = {};

        if (Array.isArray(config)) {
            for (const path of config) {
                // Result is we want the final key value pair to be added to the config
                const value = this.getNestedValue(decoded, path);
                const finalKey = path.split('.').pop();
                userConfig[finalKey] = value;
            }
            return userConfig;
        }

        return config;
    }

    /**
     * Handles the authentication process.
     * @param {*} req - The request object.
     * @returns {Object} - The authentication result.
     */
    async handleAuth(req) {
        const token = req.body.token;
        if (!token) {
            throw new AuthError('No token provided', 400);
        }
        let decoded = this.decodeJWT(token);
        return this.createResponse(decoded);
    }

    /**
     * Calculates the expiration time based on the decoded token.
     * @param {Object} decoded - The decoded JWT payload.
     * @returns {number} - The time until expiration in seconds.
     */
    calculateExpiration(decoded) {
        const expirationField = this.config.expirationField.field;
        if (!decoded[expirationField]) {
            throw new AuthError(`Token does not contain expiration field '${expirationField}'`, 400);
        }

        const expirationFormat = this.config.expirationField.format;
        var expirationTime = decoded[expirationField];

        let parsedTime;
        if (expirationFormat === 'unix') {
            // Usually in JWTs this is a Unix timestamp in seconds
            parsedTime = dayjs.unix(expirationTime);
        } else {
            // If it's not Unix then the format is specified by the user
            parsedTime = dayjs(expirationTime, expirationFormat);
        }

        // Get seconds until expiration
        const secondsUntilExpiration = parsedTime.diff(Date.now(), 'second');
        return secondsUntilExpiration
    }

    /**
     * Merges two permission objects, combining their access rights
     * This is used if a JWT has multiple claims that grant permissions in which case the highest level of access should be granted.
     * @param {Object} existing - Existing permissions
     * @param {Object} newPerms - New permissions to merge
     * @returns {Object} - Merged permissions
     */
    mergePermissions(existing, newPerms) {
        // If either grants everything, return everything
        if (existing.everything || newPerms.everything) {
            return {
                everything: true,
                queriesByCollection: {}
            };
        }

        // Merge queriesByCollection
        const merged = {
            everything: false,
            queriesByCollection: { ...existing.queriesByCollection }
        };

        // Add new collection queries
        Object.entries(newPerms.queriesByCollection).forEach(([collection, queries]) => {
            if (!merged.queriesByCollection[collection]) {
                merged.queriesByCollection[collection] = [];
            }

            // Merge query arrays, avoiding duplicates
            const existingQueries = new Set(merged.queriesByCollection[collection]);
            queries.forEach(query => existingQueries.add(query));
            merged.queriesByCollection[collection] = Array.from(existingQueries);
        });

        return merged;
    }

    /**
     * Get nested value from object using dot notation path
     * @param {Object} obj - The object to extract value from
     * @param {string} path - Dot notation path (e.g., 'user.role' or 'claims.department')
     * @returns {*} - The value at the path or undefined
     */
    getNestedValue(obj, path) {
        let currentObj = obj;
        let remainingPath = path;

        // Users can use dots in keys but they are also used for nested paths.
        // So we need to handle both cases by progressively checking keys.
        while (remainingPath !== '') {
            const parts = remainingPath.split('.');
            let found = false;

            // Try progressively longer key combinations
            for (let i = 1; i <= parts.length; i++) {
                const key = parts.slice(0, i).join('.');

                if (currentObj.hasOwnProperty(key)) {
                    currentObj = currentObj[key];
                    remainingPath = parts.slice(i).join('.');
                    found = true;
                    break;
                }
            }

            if (!found) {
                return undefined; // No match found
            }
        }

        return currentObj;
    }

    /**
     * Converts permission format to Ditto's expected format.
     * @param {string|Object} permission - Either '*' or collection queries object
     * @returns {Object} - Ditto permission format
     */
    convertPermissionFormat(permission) {
        return permission === '*'
            ? { everything: true, queriesByCollection: {} }
            : {
                everything: false,
                queriesByCollection: permission || {}
            }
    }

    /**
     * Starts the Express server.
     * @param {number} port - The port to listen on.
     */
    start(port = process.env.PORT || 3000) {
        this.app.listen(port, () => {
            console.log(`Auth Webhook server running on port ${port}`);
        });
    }
}

// Export the class for flexibility
module.exports = {
    AuthWebhook
};

// If this file is run directly, create and start the server
if (require.main === module) {
    const authWebhook = new AuthWebhook();
    authWebhook.start();
}