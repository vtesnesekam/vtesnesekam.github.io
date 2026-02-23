/* App entry */

import { initPlayer } from './player-logic.js';
import { initUI } from './ui-logic.js';

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");
  
    if (!source || source === "false") {
      window.location.href = "pagenotfound.html";
      return
    }
  } catch (e) {
    window.location.href = "pagenotfound.html";
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
