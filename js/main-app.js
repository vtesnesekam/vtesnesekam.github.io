// main.js - Your main application file

import { initPlayer } from './player-logic.js';
import { initUI } from './ui-logic.js';
import { AesDecryptionService } from './security.js';

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const decryptor = new AesDecryptionService();
        const source = params.get("source");
        
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
