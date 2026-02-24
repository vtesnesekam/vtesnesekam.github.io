// Simple asset helpers with time sync and expiry validation

/**
 * Get network time from multiple sources (matches Flutter TimeService)
 * @returns {Promise<number>} Network time in milliseconds since epoch
 */
import { AesDecryptionService } from './security.js';
async function getNetworkTime() {
  // Reliable time sources (matching Flutter)
  const timeApis = [
    'https://worldtimeapi.org/api/timezone/Etc/UTC',
    'https://timeapi.io/api/Time/current/zone?timeZone=UTC',
    'https://google.com' // For header-based time
  ];

  // Try timeapi.io first (stable alternative)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=UTC', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      // timeapi.io returns { dateTime: "2023-10-27T10:00:00.000Z" }
      if (data.dateTime) {
        return new Date(data.dateTime).getTime();
      }
    }
  } catch (error) {
    console.log('timeapi.io failed, trying next source...', error);
  }

  // Try worldtimeapi.org as fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      // worldtimeapi returns { datetime: "2023-10-27T10:00:00.000Z" }
      if (data.datetime) {
        return new Date(data.datetime).getTime();
      }
    }
  } catch (error) {
    console.log('worldtimeapi.org failed, trying Google header...', error);
  }

  // Try Google header as last resort
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://google.com', {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const dateHeader = response.headers.get('date');
    if (dateHeader) {
      return new Date(dateHeader).getTime();
    }
  } catch (error) {
    console.log('Google header failed', error);
  }

  // Final fallback - device time
  console.warn('All network time sources failed, using device time');
  return Date.now();
}

/**
 * Decrypt and validate source parameter
 * @param {string} encryptedSource - The encrypted source parameter from URL
 * @returns {Promise<{valid: boolean, key: string|null, reason?: string}>}
 */
async function validateAndDecryptSource(encryptedSource) {
  try {
    if (!encryptedSource || encryptedSource === "false") {
      return { valid: false, key: null, reason: 'Missing source' };
    }

    // Decode the URL-encoded source
    const decodedSource = decodeURIComponent(encryptedSource);
    
    // Create decryptor instance
    const decryptor = new AesDecryptionService();
    
    // Decrypt the source
    const decryptedJson = decryptor.decryptText(decodedSource);
    
    // Parse the JSON payload
    const payload = JSON.parse(decryptedJson);
    
    // Check if payload has required fields
    if (!payload.expiry || !payload.key) {
      return { valid: false, key: null, reason: 'Invalid payload structure' };
    }
    
    // Get network time (matching Flutter)
    const networkTime = await getNetworkTime();
    const expiryTime = payload.expiry;
    
    // Check if expired
    if (networkTime >= expiryTime) {
      return { 
        valid: false, 
        key: null, 
        reason: `Source expired: current time ${new Date(networkTime).toISOString()} >= expiry ${new Date(expiryTime).toISOString()}`
      };
    }
    
    // Valid - return the key
    return { 
      valid: true, 
      key: payload.key,
      expiry: expiryTime,
      currentTime: networkTime,
      timeRemaining: Math.floor((expiryTime - networkTime) / 1000) // seconds remaining
    };
    
  } catch (error) {
    console.error('Source validation error:', error);
    return { valid: false, key: null, reason: error.message };
  }
}

/**
 * Load channels from validated source
 * @returns {Promise<Array>} Array of channels
 */
export async function loadChannels() {
  try {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");

    // Validate and decrypt the source
    const validation = await validateAndDecryptSource(source);

    // Log validation info for debugging
    console.log('Source validated:', {
      key: validation.key,
      expires: new Date(validation.expiry).toISOString(),
      timeRemaining: validation.timeRemaining + ' seconds'
    });

    // Validate the key as a URL
    try {
      const parsedUrl = validation.key;
      console.log('Fetching channels from:', validation.key);
      
      const res = await fetch(parsedUrl, { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`Failed to fetch channels.json: ${res.status}`);
      }

      const list = await res.json();

      if (!Array.isArray(list)) {
        throw new Error("Invalid JSON format: expected an array");
      }
      
      // Clean URL and return filtered list
      window.history.pushState({}, '', '/');
      return list.filter(Boolean);
      
    } catch (urlError) {
      console.error('Invalid key URL:', validation.key, urlError);
      throw new Error('Invalid source URL format');
    }

  } catch (error) {
    console.error("Error loading channels:", error);
    
    return [];
  }
}

/**
 * Get time remaining for current session
 * @returns {Promise<number|null>} Seconds remaining or null if not validated
 */
export async function getTimeRemaining() {
  try {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");
    
    const validation = await validateAndDecryptSource(source);
    
    if (validation.valid) {
      return validation.timeRemaining;
    }
    return null;
  } catch {
    return null;
  }
}
