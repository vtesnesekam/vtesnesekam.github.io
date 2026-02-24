// security.js - AES Decryption Service for Flutter compatibility

// Load CryptoJS from CDN (it will be available globally)
// We don't need to import it as a module since it attaches to window

export class AesDecryptionService {
    constructor() {
        // Check if CryptoJS is available
        if (typeof CryptoJS === 'undefined') {
            console.error('CryptoJS not loaded. Make sure to include the script in your HTML.');
            throw new Error('CryptoJS is required for decryption');
        }

        // AES-256 requires exactly 32 bytes
        this._rawKey = "makesense@2026makesense@2026!!!!";
        // IV must be exactly 16 bytes for AES CBC
        this._rawIv = "1234567890123456";
        
        // Parse key and IV once for efficiency
        this.key = CryptoJS.enc.Utf8.parse(this._rawKey);
        this.iv = CryptoJS.enc.Utf8.parse(this._rawIv);
    }

    /**
     * Decrypt text encrypted by Flutter app
     * @param {string} encryptedBase64 - Base64 encrypted string from Flutter
     * @returns {string} - Decrypted plain text
     */
    decryptText(encryptedBase64) {
        try {
            if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
                throw new Error('Invalid encrypted data');
            }

            // Decrypt using AES-256-CBC with PKCS7 padding
            const decrypted = CryptoJS.AES.decrypt(encryptedBase64, this.key, {
                iv: this.iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            
            // Convert to UTF8 string
            const result = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!result) {
                throw new Error('Decryption failed - invalid data or key');
            }
            
            return result;
        } catch (error) {
            console.error('Decryption error:', error.message);
            throw error;
        }
    }

    /**
     * Validate if encrypted string is valid (can be decrypted)
     * @param {string} encryptedBase64 
     * @returns {boolean}
     */
    isValid(encryptedBase64) {
        try {
            if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
                return false;
            }
            
            const decrypted = this.decryptText(encryptedBase64);
            return decrypted !== null && decrypted.length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Decrypt and parse as JSON
     * @param {string} encryptedBase64 
     * @returns {object}
     */
    decryptJSON(encryptedBase64) {
        const decrypted = this.decryptText(encryptedBase64);
        return JSON.parse(decrypted);
    }

    /**
     * Get configuration info (for debugging)
     * @returns {object}
     */
    getConfig() {
        return {
            algorithm: 'AES-256-CBC',
            key: this._rawKey,
            keyLength: this._rawKey.length,
            iv: this._rawIv,
            ivLength: this._rawIv.length,
            padding: 'PKCS7'
        };
    }
}

// Also export a default instance if needed
export default AesDecryptionService;
