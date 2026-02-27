window.addEventListener('DOMContentLoaded', async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const source = params.get("source");
        
        // Manage storage (check existence, save if new, trim to 20)
        if (!manageStorage(source)) {
            return; // Stop execution if source already exists (redirect already happened)
        }
    } catch (err) {
        console.error("Error handling DOMContentLoaded:", err);
    }
});

// Helper function to manage storage with max limit of 20 items
function manageStorage(source) {
    const STORAGE_KEY = 'validSources';
    const MAX_ITEMS = 20;
    
    let sources = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (sources.includes(source)) {
        window.history.pushState({}, '', '/');
        window.location.href = "pagenotfound.html";
        return false;
    }
    
    sources.unshift(source);
    
    if (sources.length > MAX_ITEMS) {
        sources = sources.slice(0, MAX_ITEMS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
    
    return true;
}
