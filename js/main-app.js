/* App entry */

import { initPlayer } from './player-logic.js';
import { initUI } from './ui-logic.js';
import { AesDecryptionService } from './security.js';

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const decryptor = new AesDecryptionService();
    const source = params.get("source");
    bool isValidSource = await decryptor.isValid(source);
  
    if (!source || source === "false" || !isValidSource) {
      window.location.href = "pagenotfound.html";
      window.history.pushState({}, '', '/');
      return
    }
  } catch (e) {
    window.location.href = "pagenotfound.html";
    window.history.pushState({}, '', '/');
    return;
  }


  
  try {
    await initPlayer();
  } catch (e) {
    console.error('Player init failed', e);
  }

  try {
    await initUI();
  } catch (e) {
    console.error('UI init failed', e);
  }
});
