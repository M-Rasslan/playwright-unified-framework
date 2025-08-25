const BrowserManager = require('./BrowserManager');

class AuthManager {
    constructor() {
        this.browserManager = new BrowserManager();
        this._initApiTokenCache();
    }

    /**
     * Perform login and save authentication state
     * @param {Object} credentials - Login credentials
     * @param {string} credentials.baseUrl - Base URL for the application
     * @param {string} credentials.userName - Username
     * @param {string} credentials.password - Password
     * @param {string} browserName - Target browser name (optional)
     * @returns {Promise<void>}
     */
    async authenticate(credentials, browserName = null) {
        const { baseUrl, userName, password } = credentials;
        
        // Use specified browser or fall back to BrowserManager detection
        const targetBrowser = browserName || this.browserManager.getCurrentBrowserName();
        
        const browser = await this.browserManager.launchBrowser(targetBrowser, true); // true = headless for auth
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            const stateFilePath = this.browserManager.getStateFilePath(targetBrowser);
            
            // Perform login
            await page.goto(`${baseUrl}/login`);
            await page.getByRole('textbox', { name: 'Username' }).fill(userName);
            await page.getByRole('textbox', { name: 'Password' }).fill(password);
            await page.getByRole('checkbox', { name: 'Remember me' }).check();
            await page.getByRole('button', { name: 'Login' }).click();
            await page.waitForLoadState('networkidle');

            // Wait to ensure authentication is complete
            // Note: Consider using page.waitForLoadState('networkidle') instead of waitForTimeout
            await page.waitForLoadState('networkidle');

            // Save authentication state BEFORE any navigation
            await context.storageState({ path: stateFilePath });
            
            // Close the context and browser immediately after saving state
            await context.close();
            await browser.close();
            
        } catch (error) {
            // Ensure cleanup even on error
            try {
                await context.close();
                await browser.close();
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
            throw new Error(`Authentication failed with ${targetBrowser}: ${error.message}`);
        }
    }

    /**
     * Get authentication state file path
     * @param {string} browserName - Browser name (optional)
     * @returns {string} Path to state file
     */
    getStateFilePath(browserName = null) {
        return this.browserManager.getStateFilePath(browserName);
    }

    /**
     * Check if authentication state file exists
     * @param {string} browserName - Browser name (optional)
     * @returns {boolean} True if state file exists
     */
    hasStateFile(browserName = null) {
        return this.browserManager.hasStateFile(browserName);
    }

    /**
     * Setup authenticated test environment (browser, context, page)
     * This method handles the common pattern used in tests
     * @param {string} browserName - Target browser name (optional)
     * @returns {Promise<Object>} Object containing browser, context, and page
     */
    async setupTestEnvironment(browserName = null) {
        const browser = await this.browserManager.launchBrowser(browserName, false); // false = headed for tests
        const context = await this.browserManager.createAuthenticatedContext(browser, browserName);
        const page = await context.newPage();
        
        return { browser, context, page };
    }

    /**
     * Cleanup test environment (close context and browser)
     * @param {Object} env - Environment object from setupTestEnvironment
     */
    async cleanupTestEnvironment(env) {
        const { context, browser } = env;
        if (context) await context.close();
        if (browser) await browser.close();
    }

    // ===== NEW API TOKEN MANAGEMENT METHODS =====
    
    /**
     * Initialize API token cache
     */
    _initApiTokenCache() {
        this.apiToken = null;
        this.apiBaseUrl = null;
        this.apiLoginEndpoint = null;
    }

    /**
     * Set API credentials for token-based authentication
     * @param {string} baseUrl - Base URL for the API
     * @param {string} loginEndpoint - Login endpoint (default: '/login')
     */
    setApiCredentials(baseUrl, loginEndpoint = '/login') {
        this.apiBaseUrl = baseUrl;
        this.apiLoginEndpoint = loginEndpoint;
    }

    /**
     * Get API token (fetches if not cached)
     * @returns {Promise<string>} API token
     */
    async getApiToken() {
        if (!this.apiBaseUrl || !this.apiLoginEndpoint) {
            throw new Error('API credentials not set. Call setApiCredentials() first.');
        }

        if (this.apiToken) {
            return this.apiToken;
        }

        try {
            // Import payload dynamically to get fresh values from .env
            const loginPayload = require('../test-data/loginPayload.json');
            
            const response = await fetch(`${this.apiBaseUrl}${this.apiLoginEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginPayload),
            });

            if (!response.ok) {
                throw new Error(`API login failed: ${response.status} ${response.statusText}`);
            }

            const responseBody = await response.json();
            // Flexible token extraction - you can customize this based on your API response
            this.apiToken = responseBody.token || responseBody.access_token || responseBody.jwt || responseBody.accessToken;
            
            if (!this.apiToken) {
                throw new Error('No token found in API response. Check your API response format.');
            }

            return this.apiToken;
        } catch (error) {
            throw new Error(`Failed to get API token: ${error.message}`);
        }
    }

    /**
     * Get authentication headers for API requests
     * @returns {Promise<Object>} Headers object with Authorization
     */
    async getApiAuthHeaders() {
        const token = await this.getApiToken();
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Inject API token into browser context for API calls
     * @param {BrowserContext} context - Browser context to inject token into
     * @returns {Promise<void>}
     */
    async injectTokenToBrowserContext(context) {
        const token = await this.getApiToken();
        
        // Inject token into context for API calls
        await context.addInitScript((token) => {
            window.apiToken = token;
            window.getAuthHeaders = () => ({
                'Authorization': `Bearer ${token}`
            });
        }, token);
    }

    /**
     * Clear API token cache
     */
    clearApiToken() {
        this.apiToken = null;
    }

    /**
     * Force fetch a new token (ignores cache)
     * @returns {Promise<string>} New API token
     */
    async forceNewToken() {
        this.apiToken = null; // Clear cached token
        return await this.getApiToken(); // Fetch fresh token
    }
}

module.exports = AuthManager;
