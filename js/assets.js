// Simple asset helpers

export async function loadChannels() {
  try {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");

    if (!source) {
      throw new Error("Missing 'source' parameter in URL");
    }

    const parsedUrl = new URL(source); // validates URL format

    const res = await fetch(parsedUrl.href, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Failed to fetch channels.json: ${res.status}`);
    }

    const list = await res.json();

    if (!Array.isArray(list)) {
      throw new Error("Invalid JSON format: expected an array");
    }

    return list.filter(Boolean);

  } catch (error) {
    console.error("Error loading channels:", error);
    return [];
  }
}
