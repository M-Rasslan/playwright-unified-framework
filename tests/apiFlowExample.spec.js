/**
 * Example: API Flow with Token Management
 * Demonstrates the new API token capabilities
 */

const { test, expect } = require('@playwright/test');
const AuthManager = require('../utils/AuthManager');
const { apiUtils } = require('../utils/apiUtils');

test.describe('API Flow with Token Management', () => {
    let authManager;
    let apiUtilsInstance;

    test.beforeAll(async () => {
        // Initialize AuthManager
        authManager = new AuthManager();
        
        // Set API credentials with base URL
        authManager.setApiCredentials('https://api.yourapp.com', '/auth/login');
        
        // Initialize apiUtils with AuthManager integration
        const apiContext = {}; // Your API context here
        apiUtilsInstance = new apiUtils(apiContext, 'https://api.yourapp.com', authManager);
    });

    test.beforeEach(async () => {
        // Fresh token for each test (test isolation)
        await authManager.forceNewToken();
    });

    test('API authentication and token caching', async () => {
        // First call - fetches and caches token
        const token1 = await authManager.getApiToken();
        expect(token1).toBeTruthy();
        
        // Second call - uses cached token (no API call)
        const token2 = await authManager.getApiToken();
        expect(token2).toBe(token1); // Same token from cache
        
        // Get authentication headers
        const headers = await authManager.getApiAuthHeaders();
        expect(headers.Authorization).toContain('Bearer');
    });

    test('API calls with automatic token management', async () => {
        // All token-based methods now use AuthManager automatically
        const response = await apiUtilsInstance.getWithToken('/users/profile');
        expect(response.status()).toBe(200);
        
        // POST with token
        const userData = { name: 'Test User', email: 'test@example.com' };
        const postResponse = await apiUtilsInstance.postWithToken('/users', userData);
        expect(postResponse.status()).toBe(201);
    });

    test('Force new token for specific test case', async () => {
        // Get current token
        const token1 = await authManager.getApiToken();
        
        // Force new token for this specific test case
        const token2 = await authManager.forceNewToken();
        
        // Tokens should be different
        expect(token2).not.toBe(token1);
        
        // Use new token for API call
        const response = await apiUtilsInstance.getWithToken('/users');
        expect(response.status()).toBe(200);
    });

    test('Error handling for expired tokens', async () => {
        // Simulate expired token scenario
        await authManager.clearApiToken();
        
        // Should automatically fetch new token
        const token = await authManager.getApiToken();
        expect(token).toBeTruthy();
        
        // API calls should work with new token
        const response = await apiUtilsInstance.getWithToken('/users');
        expect(response.status()).toBe(200);
    });

    test('UI page with API token injection', async () => {
        // Setup browser environment
        const { browser, context, page } = await authManager.setupTestEnvironment('chromium');
        
        try {
            // Inject API token into browser context
            await authManager.injectTokenToBrowserContext(context);
            
            // Navigate to page
            await page.goto('https://yourapp.com/dashboard');
            
            // Token is now available in browser context
            const token = await page.evaluate(() => window.apiToken);
            expect(token).toBeTruthy();
            
            // Can make authenticated API calls from browser
            const apiResponse = await page.evaluate(async () => {
                const headers = window.getAuthHeaders();
                return await fetch('/api/users/profile', { headers });
            });
            
            // Verify API call was made with token
            expect(apiResponse).toBeTruthy();
            
        } finally {
            await authManager.cleanupTestEnvironment({ browser, context, page });
        }
    });

    test.afterEach(async () => {
        // Clear token cache for test isolation
        await authManager.clearApiToken();
    });

    test.afterAll(async () => {
        // Final cleanup
        await authManager.clearApiToken();
    });
});
