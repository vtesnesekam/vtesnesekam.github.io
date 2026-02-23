/* UI events & small helpers */

import { setChannels, setCategory, setSearch, getCategories } from './channel-renderer.js';
import { playChannel, getCurrentChannel } from './player-logic.js';
import { loadChannels } from './assets.js';
import { isFavorite } from './favorites.js';

const searchInput = document.getElementById('search-input');
const tabsEl = document.getElementById('category-tabs');
const clockEl = document.getElementById('clock');
const muteBtn = document.getElementById('btn-mute-toggle');
const fsBtn = document.getElementById('btn-fullscreen');
const osdEl = document.getElementById('osd');
const osdNameEl = document.getElementById('osd-name');
const osdMetaEl = document.getElementById('osd-meta');

let channels = [];
let categories = [];
let osdTimeout = null;
let channelNumberBuffer = '';
let channelNumberTimer = null;

function renderTabs() {
  if (!tabsEl) return;
  tabsEl.innerHTML = '';
  categories.forEach((cat, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tab' + (index === 0 ? ' active' : '');
    tab.textContent = cat;
    const badge = document.createElement('span');
    badge.className = 'badge';
    let count = 0;
    if (cat === 'All') {
      count = channels.length;
    } else if (cat === 'Favorites') {
      count = channels.filter((c) => isFavorite(c.name)).length;
    } else {
      count = channels.filter((c) => c.category === cat).length;
    }
    badge.textContent = count;
    tab.appendChild(badge);
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((el) => el.classList.remove('active'));
      tab.classList.add('active');
      setCategory(cat);
    });
    tabsEl.appendChild(tab);
  });
}

function startClock() {
  if (!clockEl) return;
  function tick() {
    const now = new Date();
    const time = now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    clockEl.querySelector('span')?.replaceWith(
      Object.assign(document.createElement('span'), { textContent: time })
    );
  }
  tick();
  setInterval(tick, 20_000);
}

function wireSearch() {
  if (!searchInput) return;
  let timeout;
  searchInput.addEventListener('input', () => {
    const value = searchInput.value || '';
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => setSearch(value), 120);
  });
}

function wirePlayerControls() {
  const video = document.getElementById('video');
  if (!video) return;

  if (muteBtn) {
    const updateIcon = () => {
      muteBtn.textContent = video.muted ? '🔇' : '🔈';
    };
    updateIcon();
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      updateIcon();
    });
  }

  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      const container = document.getElementById('video-container');
      if (!document.fullscreenElement) {
        container?.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });
  }

  // Swipe left/right to change channels
  const container = document.getElementById('video-container');
  if (container) {
    let touchStartX = null;
    let touchStartY = null;

    container.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    });

    container.addEventListener('touchend', (e) => {
      if (touchStartX === null || touchStartY === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      touchStartX = null;
      touchStartY = null;

      const threshold = 40;
      if (absDx > threshold && absDx > absDy && channels.length) {
        const current = getCurrentChannel();
        let idx = channels.findIndex((c) => c.name === (current && current.name));
        if (idx < 0) idx = 0;
        if (dx < 0) {
          // swipe left -> next
          idx += 1;
        } else {
          // swipe right -> previous
          idx -= 1;
        }
        if (idx < 0) idx = channels.length - 1;
        if (idx >= channels.length) idx = 0;
        playChannel(channels[idx]);
      }
    });
  }
}

function showOsd(channel) {
  if (!osdEl || !channel) return;
  if (osdTimeout) {
    clearTimeout(osdTimeout);
    osdTimeout = null;
  }
  const idx = channels.findIndex((c) => c.name === channel.name);
  const number = idx >= 0 ? idx + 1 : '';
  if (osdNameEl) osdNameEl.textContent = channel.name;
  if (osdMetaEl) {
    const parts = [];
    if (number) parts.push(`#${number.toString().padStart(2, '0')}`);
    if (channel.category) parts.push(channel.category);
    osdMetaEl.textContent = parts.join(' • ');
  }
  osdEl.classList.add('visible');
  osdTimeout = window.setTimeout(() => {
    osdEl.classList.remove('visible');
  }, 3000);
}

function wireChannelOsd() {
  window.addEventListener('channel-changed', (ev) => {
    if (ev?.detail?.channel) {
      showOsd(ev.detail.channel);
    }
  });
}

function wireKeyboardControls() {
  window.addEventListener('keydown', (e) => {
    const target = e.target;
    const tag = target && target.tagName;
    const isTyping =
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      (target && target.isContentEditable);

    // Ignore shortcuts while typing in inputs
    if (isTyping) return;

    // Fullscreen toggle (F/f)
    if (e.key === 'F' || e.key === 'f') {
      e.preventDefault();
      const container = document.getElementById('video-container');
      if (!document.fullscreenElement) {
        container?.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      return;
    }

    // Channel surf with arrows
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (!channels.length) return;
      const current = getCurrentChannel();
      let idx = channels.findIndex((c) => c.name === (current && current.name));
      if (idx < 0) idx = 0;
      idx += e.key === 'ArrowRight' ? 1 : -1;
      if (idx < 0) idx = channels.length - 1;
      if (idx >= channels.length) idx = 0;
      playChannel(channels[idx]);
      return;
    }

    // Direct channel number entry (2s debounce)
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      channelNumberBuffer += e.key;
      if (channelNumberTimer) {
        clearTimeout(channelNumberTimer);
      }
      channelNumberTimer = window.setTimeout(() => {
        const num = parseInt(channelNumberBuffer, 10);
        channelNumberBuffer = '';
        if (!Number.isNaN(num) && num >= 1 && num <= channels.length) {
          playChannel(channels[num - 1]);
        }
      }, 2000);
    }
  });
}

let overlayHideTimeout = null;

function setupOverlayAutoHide() {
  const container = document.getElementById('video-container');
  if (!container) return;

  const scheduleHide = () => {
    if (overlayHideTimeout) {
      clearTimeout(overlayHideTimeout);
    }
    overlayHideTimeout = window.setTimeout(() => {
      container.classList.add('overlays-hidden');
    }, 10000);
  };

  const markActivity = () => {
    container.classList.remove('overlays-hidden');
    scheduleHide();
  };

  ['click', 'touchstart'].forEach((ev) => {
    container.addEventListener(ev, markActivity);
  });
  window.addEventListener('keydown', markActivity);

  markActivity();
}

export async function initUI() {
  startClock();
  wireSearch();
  wirePlayerControls();
  wireKeyboardControls();
  wireChannelOsd();

  channels = await loadChannels();
  categories = getCategories(channels);
  renderTabs();
  setChannels(channels);

  // Autoplay first channel if available
  if (channels[0]) {
    playChannel(channels[0]);
  }

  setupOverlayAutoHide();
}
