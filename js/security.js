class AesEncryptionService {
  constructor() {
    // Match Flutter's key generation
    const secretString = "makesense@2026";
    this.securityKey = btoa(secretString); // base64 encode
    
    // Match Flutter's IV: utf8.decode(Uint8List(16)) = 16 null bytes as string
    this.ivString = '\0'.repeat(16);
  }

  async decryptText(encryptedBase64) {
    try {
      // Convert key to bytes (using UTF8)
      const keyBuffer = new TextEncoder().encode(this.securityKey);
      
      // Convert IV to bytes (null characters become zero bytes)
      const ivBuffer = new TextEncoder().encode(this.ivString);
      
      // Import the key for Web Crypto
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      );
      
      // Decode base64 ciphertext
      const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
      
      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-CBC',
          iv: ivBuffer
        },
        cryptoKey,
        encryptedData
      );
      
      // Convert decrypted data to string
      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      return decryptedText;
      
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  async isValid(encryptedText) {
    try {
      await this.decryptText(encryptedText);
      return true;
    } catch (e) {
      return false;
    }
  }
}
