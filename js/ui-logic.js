/* UI events & small helpers */

import { setChannels, setCategory, setSearch, getCategories } from './channel-renderer.js';
import { playChannel, getCurrentChannel } from './player-logic.js';
import { loadChannels } from './assets.js';
import { isFavorite } from './favorites.js';

const searchInput = document.getElementById('search-input');
const tabsEl = document.getElementById('category-tabs');
const clockEl = document.getElementById('clock');
const muteBtn = document.getElementById('btn-mute-toggle');
const muteLabel = document.getElementById('mute-label');
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
  
  
  if (muteBtn && muteLabel) {
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      muteLabel.textContent = video.muted ? 'Unmute' : 'Mute';
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

    // Fullscreen toggle (F/f) always works
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

    // Ignore other shortcuts while typing in inputs
    if (isTyping) return;

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

}