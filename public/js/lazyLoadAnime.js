document.addEventListener('DOMContentLoaded', () => {
    const pageType = document.body.dataset.pageType; // Identify which page this is
    const animeContainer = document.querySelector('.anime-cards-container');
    const animeIdsElement = document.getElementById('animeIds');

    if (!animeContainer || !animeIdsElement) return; // Exit if not found

    const animeIds = JSON.parse(animeIdsElement.dataset.ids);
    let loadedCount = 3; // Start from the 4th anime

    async function loadMoreAnime() {
        if (loadedCount >= animeIds.length) return; // Stop when all anime are loaded

        const animeId = animeIds[loadedCount];
        loadedCount++; // Move to next anime

        try {
            await delay(1000); // 1-second delay per fetch

            const response = await fetch(`/fetchAnime?id=${animeId}`);
            const html = await response.text();
            animeContainer.insertAdjacentHTML('beforeend', html);
        } catch (error) {
            console.error(`Error fetching anime (${pageType}):`, error);
        }
    }

    // Load 1 anime every second
    setInterval(loadMoreAnime, 1000);
});

// Simple delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}