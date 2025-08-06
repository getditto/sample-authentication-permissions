// Ditto configurable auth webhook implementation

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { jwtDecode } = require('jwt-decode');
const jwt = require('jsonwebtoken');

class AuthWebhook {
    constructor() {
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.permissionsMap = {};

        // Logging middleware
        this.app.use((req, _, next) => {
            console.log(`${req.method} ${req.url}`);
            next();
        });

        this.loadConfig();
        this.setupEndpoints();
    }

    /**
     * Loads the configuration from config.json.
     */
    loadConfig() {
        this.config = require('./config.json');
        // Set default values if not present
        this.config.userIDField = this.config.userIDField || 'sub';
        this.config.defaultExpirationSeconds = this.config.defaultExpirationSeconds || 3600;

        // Check for required fields
        if (!this.config.roles || !this.config.userIDField) {
            throw new Error('The config is invalid.');
        }
        this.buildClaimsMap();
    }

    /**
     * Sets up the endpoints for the Auth Webhook.
     */
    setupEndpoints() {
        // Health check endpoint
        this.app.get('/', (_, res) => {
            res.json({
                status: 'running',
                service: 'Auth Webhook',
                timestamp: new Date().toISOString()
            });
        });

        // Generic Auth endpoint
        this.app.post('/auth', (req, res) => {
            try {
                const result = this.handleAuth(req);
                res.status(200).json(result);
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ error: error.message });
                }
                // If no status is set, return 500
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }

    /**
     * Decodes a JWT
     */
    decodeJWT(token) {
        try {
            if (this.config.JWTSecret) {
                return jwt.verify(token, this.config.JWTSecret);
            }
            return jwtDecode(token);
        } catch (error) {
            throw Object.assign(new Error('Invalid token'), { status: 401 });
        }
    }

    /**
     * Builds the permissions map from the configuration.
     * This structure maps a user ID to their permissions based on the roles they belong to.
     */
    buildClaimsMap() {
        this.permissionsMap = {};

        // Go through each role in the permissions config
        Object.entries(this.config.roles).forEach(([_, { members, permissions }]) => {
            // Go through each user in the role
            const readPermissions = this.convertPermissionFormat(permissions.read);
            const writePermissions = this.convertPermissionFormat(permissions.write);
            const remoteQuery = permissions.remoteQuery;

            members.forEach(user => {
                // For each member merge their permissions
                const existingPerms = this.permissionsMap[user] || { read: { everything: false, queriesByCollection: {} }, write: { everything: false, queriesByCollection: {} } };
                this.permissionsMap[user] = {
                    read: this.mergePermissions(existingPerms.read, readPermissions),
                    write: this.mergePermissions(existingPerms.write, writePermissions),
                    remoteQuery
                };
            });
        });
    }

    /**
     * Creates the payload for the response based on the decoded JWT.
     * @param {Object} decoded - The decoded JWT payload.
     * @returns {Object} - The payload to be returned in the response.
     */
    createPayload(decoded) {
        const userIDField = this.config.userIDField;
        const userID = this.getNestedValue(decoded, userIDField);
        const permissions = this.permissionsMap[userID]

        if (!permissions) {
            return { authenticated: false };
        }

        const response = {
            authenticated: true,
            userID,
            expirationSeconds: this.calculateExpiration(decoded),
            permissions
        };

        // Add optional fields
        ['clientInfo', 'identityServiceMetadata'].forEach(field => {
            if (this.config[field]) {
                response[field] = this.extractConfigField(decoded, field);
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
    handleAuth(req) {
        const token = req.body.token;

        if (!token) {
            const error = new Error('Token is required');
            error.status = 400;
            throw error;
        }

        let decoded = this.decodeJWT(token);

        // Check if the token has expired
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            throw Object.assign(new Error('Token has expired'), { status: 401 });
        }

        const payload = this.createPayload(decoded);

        return payload;
    }

    /**
     * Calculates the expiration time based on the decoded token.
     * @param {Object} decoded - The decoded JWT payload.
     * @param {number} defaultExpiration - The default expiration time in seconds.
     * @returns {number} - The time until expiration in seconds.
     */
    calculateExpiration(decoded) {
        if (!decoded.exp) return this.config.defaultExpirationSeconds;
        return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
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
        // First, try the entire path as a single key (handles keys with dots)
        if (obj.hasOwnProperty(path)) {
            return obj[path];
        }
        
        // If that doesn't work, fall back to dot notation splitting
        const split = path.split('.');
        return split.reduce((current, key) =>
            current && typeof current === 'object' ? current[key] : undefined, obj
        );
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