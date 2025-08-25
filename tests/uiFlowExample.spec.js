/**
 * Example: UI Flow with Browser Authentication
 * Demonstrates the existing browser authentication capabilities
 */

const { test, expect } = require('@playwright/test');
const AuthManager = require('../utils/AuthManager');

test.describe('UI Flow with Browser Authentication', () => {
    let authManager;

    test.beforeAll(async () => {
        // Initialize AuthManager
        authManager = new AuthManager();
        
        // Perform browser authentication (saves state file)
        await authManager.authenticate({
            baseUrl: 'https://yourapp.com',
            userName: 'testuser',
            password: 'testpass'
        }, 'chromium');
    });

    test('Browser authentication state verification', async () => {
        // Check if authentication state file exists
        expect(authManager.hasStateFile('chromium')).toBe(true);
        
        // Get state file path
        const statePath = authManager.getStateFilePath('chromium');
        expect(statePath).toContain('auth-states/state-chromium.json');
    });

    test('Setup authenticated test environment', async () => {
        // Setup browser, context, and page with authentication
        const { browser, context, page } = await authManager.setupTestEnvironment('chromium');
        
        try {
            // Navigate to protected page
            await page.goto('https://yourapp.com/dashboard');
            
            // Should be authenticated (no login redirect)
            await expect(page).toHaveURL(/.*dashboard/);
            
            // Verify user is logged in
            await expect(page.locator('.user-profile')).toBeVisible();
            
        } finally {
            // Cleanup
            await authManager.cleanupTestEnvironment({ browser, context, page });
        }
    });

    test('Multiple browser support', async () => {
        // Test with different browsers
        const browsers = ['chromium', 'firefox', 'webkit'];
        
        for (const browserName of browsers) {
            // Setup environment for specific browser
            const { browser, context, page } = await authManager.setupTestEnvironment(browserName);
            
            try {
                // Navigate to protected page
                await page.goto('https://yourapp.com/dashboard');
                
                // Should be authenticated
                await expect(page).toHaveURL(/.*dashboard/);
                
            } finally {
                await authManager.cleanupTestEnvironment({ browser, context, page });
            }
        }
    });

    test('Authentication state persistence', async () => {
        // Verify state files exist for all browsers
        const browsers = ['chromium', 'firefox', 'webkit'];
        
        for (const browserName of browsers) {
            if (authManager.hasStateFile(browserName)) {
                console.log(`State file exists for ${browserName}`);
            } else {
                console.log(`No state file for ${browserName} - will need authentication`);
            }
        }
    });

    test('Error handling for invalid credentials', async () => {
        // Test with invalid credentials
        try {
            await authManager.authenticate({
                baseUrl: 'https://yourapp.com',
                userName: 'invaliduser',
                password: 'invalidpass'
            }, 'chromium');
            
            // Should not reach here
            expect(true).toBe(false);
            
        } catch (error) {
            // Should throw authentication error
            expect(error.message).toContain('Authentication failed');
        }
    });

    test('Cleanup and state management', async () => {
        // Verify current state
        expect(authManager.hasStateFile('chromium')).toBe(true);
        
        // Note: In real scenarios, you might want to clean up state files
        // This depends on your testing strategy
        console.log('Authentication state files maintained for reuse');
    });
});
