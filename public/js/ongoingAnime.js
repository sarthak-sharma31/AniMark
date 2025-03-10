document.addEventListener('DOMContentLoaded', () => {
    let loadedCount = 3; // Start from index 3 since first 3 are preloaded
    const animeCardsContainer = document.querySelector('.anime-cards-container');
    const ongoingAnimeIds = JSON.parse(document.getElementById('ongoingAnimeIds').getAttribute('data-ids'));

    async function loadMoreAnime() {
        if (loadedCount >= ongoingAnimeIds.length) return; // Stop when all anime are loaded

        const animeId = ongoingAnimeIds[loadedCount];
        loadedCount++; // Move to next anime

        try {
            await delay(1000); // 1-second delay per anime fetch

            const response = await fetch(`/fetchAnime?id=${animeId}`);
            if (!response.ok) {
                console.error(`Failed to load anime ${animeId}, retrying...`);
                setTimeout(() => loadMoreAnime(), 2000); // Retry after 2 sec if failed
                return;
            }

            const html = await response.text();
            animeCardsContainer.insertAdjacentHTML('beforeend', html);
        } catch (error) {
            console.error('Error fetching anime:', error);
        }
    }

    // Only run setInterval if there are more than 3 anime
    if (ongoingAnimeIds.length > 3) {
        setInterval(loadMoreAnime, 1000);
    }
});

// Simple delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
