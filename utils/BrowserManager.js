const { chromium, firefox, webkit } = require('@playwright/test');
const path = require('path');

class BrowserManager {
    constructor() {
        this.browserTypes = {
            chromium,
            firefox,
            webkit
        };
    }

    /**
     * Get browser instance based on environment or project context
     * @param {string} browserName - Target browser name (optional)
     * @returns {Object} Browser constructor and name
     */
    getBrowserInstance(browserName = null) {
        // If browser name is provided, use it directly
        if (browserName) {
            const normalizedName = browserName.toLowerCase();
            if (this.browserTypes[normalizedName]) {
                return {
                    browser: this.browserTypes[normalizedName],
                    name: normalizedName
                };
            }
        }

        // Try to detect Playwright project from command line arguments
        const args = process.argv;
        const projectIndex = args.findIndex(arg => arg === '--project');
        let projectName = null;
        
        if (projectIndex !== -1 && args[projectIndex + 1]) {
            projectName = args[projectIndex + 1];
        } else {
            projectName = process.env.PLAYWRIGHT_PROJECT || process.env.npm_config_project;
        }
        
        if (projectName) {
            const normalizedName = projectName.toLowerCase();
            if (this.browserTypes[normalizedName]) {
                return {
                    browser: this.browserTypes[normalizedName],
                    name: normalizedName
                };
            }
        }
        
        const fallbackBrowserName = process.env.PLAYWRIGHT_BROWSER || process.env.BROWSER || process.env.npm_config_browser || 'chromium';
        const normalizedName = fallbackBrowserName.toLowerCase();
        
        return {
            browser: this.browserTypes[normalizedName] || this.browserTypes.chromium,
            name: normalizedName
        };
    }

    /**
     * Get current browser name
     * @param {string} browserName - Target browser name (optional)
     * @returns {string} Browser name
     */
    getCurrentBrowserName(browserName = null) {
        if (browserName) {
            return browserName;
        }
        
        // Try to detect Playwright project from command line arguments
        const args = process.argv;
        const projectIndex = args.findIndex(arg => arg === '--project');
        let projectName = null;
        
        if (projectIndex !== -1 && args[projectIndex + 1]) {
            projectName = args[projectIndex + 1];
        } else {
            projectName = process.env.PLAYWRIGHT_PROJECT || process.env.npm_config_project;
        }
        
        if (projectName) {
            return projectName;
        }
        return process.env.PLAYWRIGHT_BROWSER || process.env.BROWSER || process.env.npm_config_browser || 'chromium';
    }

    /**
     * Get browser-specific state file path
     * @param {string} browserName - Browser name (optional)
     * @returns {string} Path to state file
     */
    getStateFilePath(browserName = null) {
        const targetBrowser = browserName || this.getCurrentBrowserName();
        return path.resolve(process.cwd(), 'auth-states', `state-${targetBrowser}.json`);
    }

    /**
     * Launch browser with current configuration
     * @param {string} browserName - Target browser name (optional)
     * @param {boolean} headless - Whether to run in headless mode (default: false)
     * @returns {Promise<Browser>} Browser instance
     */
    async launchBrowser(browserName = null, headless = false) {
        const { browser } = this.getBrowserInstance(browserName);
        return await browser.launch({ headless });
    }

    /**
     * Create browser context with authentication state
     * @param {Browser} browser - Browser instance
     * @param {string} browserName - Browser name (optional)
     * @returns {Promise<BrowserContext>} Browser context
     */
    async createAuthenticatedContext(browser, browserName = null) {
        const stateFilePath = this.getStateFilePath(browserName);
        return await browser.newContext({ storageState: stateFilePath });
    }

    /**
     * Check if state file exists
     * @param {string} browserName - Browser name (optional)
     * @returns {boolean} True if state file exists
     */
    hasStateFile(browserName = null) {
        const fs = require('fs');
        const stateFilePath = this.getStateFilePath(browserName);
        return fs.existsSync(stateFilePath);
    }
}

module.exports = BrowserManager;