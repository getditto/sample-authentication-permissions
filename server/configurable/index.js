// Ditto generic auth webhook implementation

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { jwtDecode } = require('jwt-decode');
const jwt = require('jsonwebtoken');

class AuthWebhook {
    constructor() {
        this.app = express();
        this.app.use(cors());
        this.permissionsMap = {};

        this.setupMiddleware();
        this.loadConfig();
        this.setupRoutes();
    }

    /**
     * Sets up the middleware for the Express app, including logging.
     */
    setupMiddleware() {
        this.app.use(bodyParser.json());
        this.app.use(cors());

        // Logging middleware
        this.app.use((req, _, next) => {
            console.log(`${req.method} ${req.url}`);
            next();
        });
    }

    /**
     * Loads the configuration from config.json and validates it.
     */
    loadConfig() {
        try {
            this.config = require('./config.json');
            this.buildClaimsMap();
        } catch (error) {
            console.error('Error loading config.json:', error.message);
            process.exit(1);
        }
    }

    /**
     * Decodes a JWT
     */
    decodeJWT(token) {
        let decoded;
        // If JWTSecret is provided, verify the signature
        if (this.config.JWTSecret) {
            try {
                // Verify and decode the token
                decoded = jwt.verify(token, this.config.JWTSecret);
            } catch (error) {
                const authError = new Error('Invalid token signature');
                authError.status = 401;
                throw authError;
            }
        } else {
            // No secret provided, just decode without verification
            try {
                decoded = jwtDecode(token);
            } catch (error) {
                const authError = new Error('Invalid token format');
                authError.status = 401;
                throw authError;
            }
        }
        return decoded;
    }

    /**
     * Builds the permissions map from the configuration.
     */
    buildClaimsMap() {
        this.permissionsMap = {};

        Object.entries(this.config.permissions).forEach(([key, permission]) => {
            // Split key to get claim path and value
            const lastDotIndex = key.lastIndexOf('.');
            const claimPath = key.substring(0, lastDotIndex);
            const claimValue = key.substring(lastDotIndex + 1);

            if (!this.permissionsMap[claimPath]) {
                this.permissionsMap[claimPath] = {};
            }

            this.permissionsMap[claimPath][claimValue] = {
                read: permission.read,
                write: permission.write,
                remoteQuery: permission.remoteQuery || false
            };
        });
    }

    /**
     * Set up the routes for the Express app.
     */
    setupRoutes() {
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
     * Creates the payload for the response based on the decoded JWT.
     * @param {Object} decoded - The decoded JWT payload.
     * @returns {Object} - The payload to be returned in the response.
     */
    createPayload(decoded) {
        const userIDField = this.config.userIDField || 'sub';
        const defaultExpirationSeconds = this.config.defaultExpirationSeconds || 3600;

        const payload = {
            authenticated: true,
            userID: this.getNestedValue(decoded, userIDField) || decoded.sub,
            expirationSeconds: this.calculateExpiration(decoded, defaultExpirationSeconds),
            permissions: this.extractPermissions(decoded)
        };

        // Add clientInfo if configured
        if (this.config.clientInfo) {
            // If the clientInfo is an array its assumed to be a list of paths to extract from the JWT
            if (Array.isArray(this.config.clientInfo)) {
                // This just gets them all and merges them into a single object
                payload.clientInfo = {};
                this.config.clientInfo.forEach(path => {
                    const value = this.getNestedValue(decoded, path);
                    if (value !== undefined) {
                        payload.clientInfo = { ...payload.clientInfo, ...value };
                    }
                });
            }
        } else {
            // Use static object from config
            payload.clientInfo = this.config.clientInfo;
        }

        // Repeat for identityServiceMetadata
        if (this.config.identityServiceMetadata) {
            if (Array.isArray(this.config.identityServiceMetadata)) {
                payload.identityServiceMetadata = {};
                this.config.identityServiceMetadata.forEach(path => {
                    const value = this.getNestedValue(decoded, path);
                    if (value !== undefined) {
                        payload.identityServiceMetadata = { ...payload.identityServiceMetadata, ...value };
                    }
                });
            } else {
                payload.identityServiceMetadata = this.config.identityServiceMetadata;
            }
        }

        return payload;
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

        /// Check if the token has expired
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            const error = new Error('Token has expired');
            error.status = 401;
            throw error;
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
    calculateExpiration(decoded, defaultExpiration) {
        // exp is a reserved claim in JWT that indicates the expiration time but may not always be present
        if (!decoded.exp) {
            return defaultExpiration;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiration = decoded.exp - currentTime;

        // If token is already expired, return 0
        return Math.max(0, timeUntilExpiration);
    }

    /**
     * Extracts permissions from the decoded JWT based on the claims map.
     * @param {Object} decoded - The decoded JWT payload.
     * @returns {Object} - The permissions object.
     */
    extractPermissions(decoded) {
        const permissions = {
            read: {},
            write: {},
            remoteQuery: false
        };

        // If the permissions map is empty, return access to everything
        if (Object.keys(this.permissionsMap).length === 0) {
            return {
                read: { everything: true, queriesByCollection: {} },
                write: { everything: true, queriesByCollection: {} },
                remoteQuery: true
            };
        }

        // Process all matching claims and merge permissions
        for (const claimPath of Object.keys(this.permissionsMap)) {
            // Get the value from the JWT using the claim path
            const claimValue = this.getNestedValue(decoded, claimPath);

            if (claimValue !== undefined && this.permissionsMap[claimPath] && this.permissionsMap[claimPath][claimValue]) {
                const claimPermissions = this.permissionsMap[claimPath][claimValue];

                // Convert simplified format to Ditto's expected format
                const readPerms = this.convertPermissionFormat(claimPermissions.read);
                const writePerms = this.convertPermissionFormat(claimPermissions.write);

                // Merge permissions
                permissions.read = this.mergePermissions(permissions.read, readPerms);
                permissions.write = this.mergePermissions(permissions.write, writePerms);

                // Enable remoteQuery if any claim allows it
                permissions.remoteQuery = permissions.remoteQuery || claimPermissions.remoteQuery || false;
            }
        }

        // If either permissions are empty, set defaults
        if (Object.keys(permissions.read).length === 0) {
            permissions.read = {
                everything: false,
                queriesByCollection: {}
            };
        }
        if (Object.keys(permissions.write).length === 0) {
            permissions.write = {
                everything: false,
                queriesByCollection: {}
            };
        }

        return permissions;
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
        Object.entries(newPerms.queriesByCollection || {}).forEach(([collection, queries]) => {
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
        const keys = path.split('.');
        let current = obj;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Converts simplified permission format to Ditto's expected format.
     * @param {string|Object} permission - Either '*' or collection queries object
     * @returns {Object} - Ditto permission format
     */
    convertPermissionFormat(permission) {
        if (permission === '*') {
            return {
                everything: true,
                queriesByCollection: {}
            };
        } else {
            return {
                everything: false,
                queriesByCollection: permission || {}
            };
        }
    }

    /**
     * Starts the Express server.
     * @param {number} port - The port to listen on.
     */
    start(port =  process.env.PORT || 3000) {
        this.app.listen(port, () => {
            console.log(`Auth Webhook server running on port ${port}`);
        });
    }
}

// Create and start the server
const authWebhook = new AuthWebhook();

// Export both the app and the class for flexibility
module.exports = {
    app: authWebhook.app,
    AuthWebhook
};

// If this file is run directly, start the server
if (require.main === module) {
    authWebhook.start();
}