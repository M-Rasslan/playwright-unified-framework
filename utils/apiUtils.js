//This class is used to handle API requests and responses
require('@playwright/test');

class apiUtils {
    
    constructor(apiContext, apiURL, authManager = null)
    {
        this.apiContext = apiContext;
        this.apiURL = apiURL;
        this.response = {};
        this.token = null;
        this.authManager = authManager; // Optional AuthManager instance
    }

    async getToken() {
        // If AuthManager is available, use it for token management
        if (this.authManager && this.authManager.apiToken) {
            return await this.authManager.getApiToken();
        }

        // Fallback to original token logic
        if (!this.token) {
            const loginPayload = require('../test-data/loginPayload'); // Import login payload
            const response = await this.apiContext.post(`${this.apiURL}/login`, {
                data: loginPayload,
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok()) {
                throw new Error(`Failed to fetch token: ${response.status()}`);
            }

            const responseBody = await response.json();
            this.token = responseBody.token; // Cache the token
        }
        return this.token;
    }

    /**
     * Get authentication headers for API requests
     * @returns {Promise<Object>} Headers object with Authorization
     */
    async getAuthHeaders() {
        // If AuthManager is available, use it for auth headers
        if (this.authManager && this.authManager.apiToken) {
            return await this.authManager.getApiAuthHeaders();
        }

        // Fallback to token-based headers
        const token = await this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
        };
    }

    //GET Methods
    async get(endpoint, headers = {}) {
        return await this.apiContext.get(`${this.apiURL}${endpoint}`, { headers });
    }

    async getWithQuery(endpoint, query, headers = {}) {
        return await this.apiContext.get(`${this.apiURL}${endpoint}`, {
            searchParams: query,
            headers,
        });
    }

    async getWithToken(endpoint, headers = {}) {
        const authHeaders = await this.getAuthHeaders();
        return await this.apiContext.get(`${this.apiURL}${endpoint}`, {
            headers: { ...authHeaders, ...headers },
        });
    }
    async getWithTokenAndQuery(endpoint, query, headers = {}) {
        const authHeaders = await this.getAuthHeaders();
        return await this.apiContext.get(`${this.apiURL}${endpoint}`, {
            searchParams: query,
            headers: { ...authHeaders, ...headers },
        });
    }

    //POST Methods
    async post(endpoint, body, headers = {}) {
        return await this.apiContext.post(`${this.apiURL}${endpoint}`, {
            data: body,
            headers,
        });
    }

    async postWithQuery(endpoint, query, body, headers = {}) {
        return await this.apiContext.post(`${this.apiURL}${endpoint}`, {
            searchParams: query,
            data: body,
            headers,
        });
    }

    async postWithToken(endpoint, body, headers = {}) {
        const authHeaders = await this.getAuthHeaders();
        return await this.apiContext.post(`${this.apiURL}${endpoint}`, {
            data: body,
            headers: { ...authHeaders, ...headers },
        });
    }

    async postWithTokenAndQuery(endpoint, query, body, headers = {}) {
        const authHeaders = await this.getAuthHeaders();
        return await this.apiContext.post(`${this.apiURL}${endpoint}`, {
            searchParams: query,
            data: body,
            headers: { ...authHeaders, ...headers },
        });
    }


    //PUT Methods
    async put(endpoint, body, headers = {}) {
        return await this.apiContext.put(`${this.apiURL}${endpoint}`, {
            data: body,
            headers,
        });
    }

    async putWithToken(endpoint, body, headers = {}) {
        const authHeaders = await this.getAuthHeaders();
        return await this.apiContext.put(`${this.apiURL}${endpoint}`, {
            data: body,
            headers: { ...authHeaders, ...headers },
        });
    }

    async putWithTokenAndQuery(endpoint, query, body, headers = {}) {
        const authHeaders = await this.getAuthHeaders();
        return await this.apiContext.put(`${this.apiURL}${endpoint}`, {
            searchParams: query,
            data: body,
            headers: { ...authHeaders, ...headers },
        });
    }

    //PATCH Methods
    async patch(endpoint, body, headers = {}) {
        return await this.apiContext.patch(`${this.apiURL}${endpoint}`, {
            data: body,
            headers,
        });
    }

    async patchWithQuery(endpoint, query, body, headers = {}) {
        return await this.apiContext.patch(`${this.apiURL}${endpoint}`, {
            searchParams: query,
            data: body,
            headers,
        });
    }

    async patchWithToken(endpoint, body, headers = {}) {
        const authHeaders = await this.getAuthHeaders();
        return await this.apiContext.patch(`${this.apiURL}${endpoint}`, {
            data: body,
            headers: { ...authHeaders, ...headers },
        });
    }

    async patchWithTokenAndQuery(endpoint, query, body, headers = {}) {
        const authHeaders = await this.getAuthHeaders();
        return await this.apiContext.patch(`${this.apiURL}${endpoint}`, {
            searchParams: query,
            data: body,
            headers: { ...authHeaders, ...headers },
        });
    }

    //DELETE Methods
    async delete(endpoint, headers = {}) {
        return await this.apiContext.delete(`${this.apiURL}${endpoint}`, { headers });
    }

    async deleteWithQuery(endpoint, query, headers = {}) {
        return await this.apiContext.delete(`${this.apiURL}${endpoint}`, {
            searchParams: query,
            headers,
        });
    }

    async deleteWithToken(endpoint, headers = {}) {
        const authHeaders = await this.getAuthHeaders();
        return await this.apiContext.delete(`${this.apiURL}${endpoint}`, {
            headers: { ...authHeaders, ...headers },
        });
    }

    async deleteWithTokenAndQuery(endpoint, query, headers = {}) {
        const authHeaders = await this.getAuthHeaders();
        return await this.apiContext.delete(`${this.apiURL}${endpoint}`, {
            searchParams: query,
            headers: { ...authHeaders, ...headers },
        });
    }

    /**
     * Set AuthManager instance for enhanced token management
     * @param {AuthManager} authManager - AuthManager instance
     */
    setAuthManager(authManager) {
        this.authManager = authManager;
    }

    /**
     * Check if AuthManager is configured
     * @returns {boolean} True if AuthManager is available
     */
    hasAuthManager() {
        return !!this.authManager;
    }
}

module.exports = { apiUtils }; //Export the class for use in other files