document.addEventListener('DOMContentLoaded', () => {
    const pageType = document.body.dataset.pageType; // Identify which page this is
    const animeContainer = document.querySelector('.anime-cards-container');
    const animeIdsElement = document.getElementById('animeIds');

    document.querySelectorAll('.a-card').forEach(card => {
        card.addEventListener('click', () => {
            const animeId = card.dataset.id;
            console.log(`These are the Id ${animeId}`);
            window.location.href = `/anime/${animeId}`;
        });
    });

    if (!animeContainer || !animeIdsElement) return; // Exit if elements are missing

    const animeIds = JSON.parse(animeIdsElement.dataset.ids);
    console.log(`These are the animeIds: ${animeIds}`);
    let loadedCount = 0;

    async function loadMoreAnime() {
        if (loadedCount >= animeIds.length) {
            clearInterval(window.lazyLoadInterval); // Stop fetching when done
            return;
        }

        const animeId = animeIds[loadedCount];
        loadedCount++;

        try {
            await delay(1500); // Increased delay to reduce rate limit issues

            const response = await fetch(`/fetchAnime?id=${animeId}`);
            if (!response.ok) throw new Error(`Failed to load anime ${animeId}`);

            const html = await response.text();
            animeContainer.insertAdjacentHTML('beforeend', html);
        } catch (error) {
            console.error(`Error fetching anime (${pageType}):`, error);
        }
    }

    // ✅ Stop previous intervals before starting a new one
    if (window.lazyLoadInterval) clearInterval(window.lazyLoadInterval);

    // Start lazy loading and store interval reference globally
    window.lazyLoadInterval = setInterval(loadMoreAnime, 1500); // Slower rate to prevent 429 errors
});

// Simple delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}