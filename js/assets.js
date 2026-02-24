// Simple asset helpers

export async function loadChannels() {
  try {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");

    if (!source) {
      window.history.pushState({}, '', '/');
      throw new Error("Missing 'source' parameter in URL");
    }

    const parsedUrl = new URL(source); // validates URL format

    const res = await fetch(parsedUrl.href, { cache: "no-store" });

    if (!res.ok) {
      window.history.pushState({}, '', '/');
      throw new Error(`Failed to fetch channels.json: ${res.status}`);
    }

    const list = await res.json();

    if (!Array.isArray(list)) {
      window.history.pushState({}, '', '/');
      throw new Error("Invalid JSON format: expected an array");
    }
    window.history.pushState({}, '', '/');
    return list.filter(Boolean);

  } catch (error) {
    window.history.pushState({}, '', '/');
    console.error("Error loading channels:", error);
    return [];
  }
}
