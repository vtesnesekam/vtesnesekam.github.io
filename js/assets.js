// Simple asset helpers

export async function loadChannels() {
  const res = await fetch('https://repolevedesnesekam.github.io/development/channels.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load channels.json');
  const list = await res.json();
  return list.filter(Boolean);
}
