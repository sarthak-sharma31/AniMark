document.addEventListener('DOMContentLoaded', () => {
    let loadedCount = 3; // Start from 4th anime
    const animeCardsContainer = document.querySelector('.anime-cards-container');
    const markedAnimeIds = JSON.parse(document.getElementById('markedAnimeIds').dataset.ids);

    async function loadMoreAnime() {
        if (loadedCount >= markedAnimeIds.length) return; // Stop when all anime are loaded

        const animeId = markedAnimeIds[loadedCount];
        loadedCount++; // Move to next anime

        try {
            await delay(1000); // 1-second delay per anime fetch

            const response = await fetch(`/fetchAnime?id=${animeId}`);
            const html = await response.text();
            animeCardsContainer.insertAdjacentHTML('beforeend', html);
        } catch (error) {
            console.error('Error fetching anime:', error);
        }
    }

    // Load 1 anime every second
    setInterval(loadMoreAnime, 1000);
});

// Simple delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
