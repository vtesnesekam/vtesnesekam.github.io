/* App entry */

import { initPlayer } from './player-logic.js';
import { initUI } from './ui-logic.js';

window.addEventListener('DOMContentLoaded', async () => {
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
