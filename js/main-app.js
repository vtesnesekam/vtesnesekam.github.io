// main.js - Your main application file

import { initPlayer } from './player-logic.js';
import { initUI } from './ui-logic.js';
import { AesDecryptionService } from './security.js';

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const decryptor = new AesDecryptionService();
        const source = params.get("source");
        // Manage storage (check existence, save if new, trim to 20)
        if (!manageStorage(source)) {
            return; // Stop execution if source already exists (redirect already happened)
        }
        // Validate source parameter
        const isValidSource = await decryptor.isValid(source);
        
        if (!source || source === "false" || !isValidSource) {
            console.log('Invalid source, redirecting to 404');
            window.history.pushState({}, '', '/');
            window.location.href = "pagenotfound.html";
            return;
        }
        
        // Optional: Log decrypted source for debugging
        try {
            const decryptedSource = decryptor.decryptText(source);
            console.log('Valid source decrypted:', decryptedSource);
        } catch (e) {
            // Silent fail - don't block execution
        }
        
    } catch (e) {
        console.error('Security validation failed:', e);
        window.history.pushState({}, '', '/');
        window.location.href = "pagenotfound.html";;
        return;
    }

    // Initialize player
    try {
        await initPlayer();
        console.log('Player initialized successfully');
    } catch (e) {
        console.error('Player init failed', e);
        window.history.pushState({}, '', '/');
        window.location.href = "pagenotfound.html";;
        return;
    }

    // Initialize UI
    try {
        await initUI();
        console.log('UI initialized successfully');
    } catch (e) {
        console.error('UI init failed', e);
        window.history.pushState({}, '', '/');
        window.location.href = "pagenotfound.html";;
        return;
    }
    
    console.log('Application started successfully');
});

// Helper function to manage storage with max limit of 20 items
function manageStorage(source) {
    const STORAGE_KEY = 'validSources';
    const MAX_ITEMS = 20;
    
    // Get existing sources array or initialize empty array
    let sources = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Check if source already exists
    if (sources.includes(source)) {
        // Source exists - redirect to 404
        window.history.pushState({}, '', '/');
        window.location.href = "pagenotfound.html";
        return false; // Stop execution
    }
    
    // Add new source to the beginning of the array
    sources.unshift(source);
    
    // Keep only the latest 20 items
    if (sources.length > MAX_ITEMS) {
        sources = sources.slice(0, MAX_ITEMS);
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
    
    return true; // Continue execution
}
