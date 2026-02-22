/* Player logic: sets up Shaka if available and handles channel loading */

let player = null;
let ui = null;
let currentChannel = null;
let unmuted = false;

const statusDotEl = document.getElementById('status-dot');
const statusTextEl = document.getElementById('status-text');
const statusTechEl = document.getElementById('status-tech');
const qualityEl = document.getElementById('current-channel-quality');

function setStatus(text, ok = true) {
  if (statusTextEl) statusTextEl.textContent = text;
  if (statusDotEl) {
    if (ok) {
      statusDotEl.style.background =
        'radial-gradient(circle at 30% 30%, #4ade80, #16a34a)';
      statusDotEl.style.boxShadow =
        '0 0 0 1px rgba(34,197,94,0.6),0 0 0 4px rgba(22,163,74,0.2)';
    } else {
      statusDotEl.style.background =
        'radial-gradient(circle at 30% 30%, #f97373, #b91c1c)';
      statusDotEl.style.boxShadow =
        '0 0 0 1px rgba(248,113,113,0.7),0 0 0 4px rgba(220,38,38,0.25)';
    }
  }
}

function detectProtocol(url) {
  if (!url) return '—';
  if (url.endsWith('.m3u8')) return 'HLS';
  if (url.endsWith('.mpd')) return 'MPEG‑DASH';
  return 'Auto';
}

export async function initPlayer() {
  const video = document.getElementById('video');
  if (!video) return;
  const hasShaka = typeof window.shaka !== 'undefined';
  statusTechEl.textContent = hasShaka ? 'Shaka' : 'HTML5';
  if (!hasShaka) {
    setStatus('Ready (HTML5 fallback)');
    return;
  }

  shaka.polyfill.installAll();
  if (!shaka.Player.isBrowserSupported()) {
    setStatus('Browser not supported, using HTML5', false);
    statusTechEl.textContent = 'HTML5';
    return;
  }

  player = new shaka.Player(video);
  ui = null;

  player.addEventListener('error', (ev) => {
    console.error('Shaka error', ev.detail);
    setStatus('Playback error', false);
  });

  player.addEventListener('loading', () => setStatus('Loading…'));
  player.addEventListener('buffering', (ev) => {
    if (ev.buffering) setStatus('Buffering…');
    else setStatus('Live');
  });

  setStatus('Ready');
}

export async function playChannel(channel) {
  const video = document.getElementById('video');
  if (!video || !channel) return;

  currentChannel = channel;
  const { url, drm } = channel;

  const tech = detectProtocol(url);
  statusTechEl.textContent = typeof window.shaka !== 'undefined' && player ? `Shaka · ${tech}` : tech;

  // UI
  const nameEl = document.getElementById('current-channel-name');
  const logoEl = document.getElementById('current-channel-logo');
  const headerText = document.getElementById('channels-header-text');
  if (nameEl) nameEl.textContent = channel.name;
  if (logoEl && channel.logo) logoEl.src = channel.logo;
  if (headerText) headerText.textContent = `${channel.category || 'Channel'} · now playing`;

  if (!player || typeof window.shaka === 'undefined') {
    // Fallback: direct src
    try {
      video.src = url;
      await video.play();

      
      setStatus('Live');
      notifyChannelChanged();
    } catch (e) {
      console.error(e);
      setStatus('Playback failed', false);
    }
    return;
  }

  try {
    const config = {
      streaming: { lowLatencyMode: true },
    };

    if (drm && typeof drm === 'object') {
      // channels.json provides clear key IDs and keys
      config.drm = { clearKeys: drm };
    }

    player.configure(config);

    await player.load(url);
    // Start playing the video
    await video.play();
      
    setStatus('Live');
    notifyChannelChanged();

    // Update resolution text if available
    const tracks = player.getVariantTracks?.() || [];
    const active = tracks.find((t) => t.active);
    if (active && qualityEl) {
      const q = `${active.height || ''}${active.height ? 'p' : ''}`;
      qualityEl.textContent = q || 'Auto';
    } else if (qualityEl) {
      qualityEl.textContent = 'Auto';
    }
  } catch (err) {
    console.error('Error loading channel', err);
    setStatus('Playback failed', false);
  }
}

export function getCurrentChannel() {
  return currentChannel;
}

function notifyChannelChanged() {
  if (!currentChannel) return;
  try {
    window.dispatchEvent(
      new CustomEvent('channel-changed', { detail: { channel: currentChannel } })
    );
  } catch {
    // ignore
  }
}