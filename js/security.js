/**
 * AES Decryption Service for GitHub Pages
 * Matches Flutter implementation: AES-256-CBC with PKCS7 padding
 * Key: "makesense@2026makesense@2026!!!!" (32 bytes)
 * IV: "1234567890123456" (16 bytes)
 */
window.AesDecryptionService = class {
    constructor() {
        // Exactly matching Flutter keys
        this.key = "makesense@2026makesense@2026!!!!";
        this.iv = "1234567890123456";
    }

    // Decrypt base64 encrypted text from Flutter
    decryptText(encryptedBase64) {
        try {
            // Convert key and IV to bytes
            const keyBytes = this._stringToBytes(this.key);
            const ivBytes = this._stringToBytes(this.iv);
            
            // Decode base64 to bytes
            const encryptedBytes = this._base64ToBytes(encryptedBase64);
            
            // AES decryption (using built-in CryptoJS if available)
            if (typeof CryptoJS !== 'undefined') {
                return this._decryptWithCryptoJS(encryptedBase64);
            } else {
                return this._decryptWithWebCrypto(keyBytes, ivBytes, encryptedBytes);
            }
        } catch (error) {
            console.error('Decryption error:', error);
            throw error;
        }
    }

    // Check if encrypted string is valid
    isValid(encryptedText) {
        try {
            this.decryptText(encryptedText);
            return true;
        } catch {
            return false;
        }
    }

    // Method 1: Using CryptoJS (included via CDN)
    _decryptWithCryptoJS(encryptedBase64) {
        // Parse key and IV
        const key = CryptoJS.enc.Utf8.parse(this.key);
        const iv = CryptoJS.enc.Utf8.parse(this.iv);
        
        // Decrypt
        const decrypted = CryptoJS.AES.decrypt(
            encryptedBase64,
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        
        return decrypted.toString(CryptoJS.enc.Utf8);
    }

    // Method 2: Using Web Crypto API
    async _decryptWithWebCrypto(keyBytes, ivBytes, encryptedBytes) {
        // Import key
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );
        
        // Decrypt
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv: ivBytes
            },
            cryptoKey,
            encryptedBytes
        );
        
        // Convert to string
        const decryptedBytes = new Uint8Array(decryptedBuffer);
        return new TextDecoder().decode(decryptedBytes);
    }

    // Helper: Convert string to bytes
    _stringToBytes(str) {
        const bytes = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes;
    }

    // Helper: Convert base64 to bytes
    _base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
}
