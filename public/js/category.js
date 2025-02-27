document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let isLoading = false; // Prevent multiple requests at the same time
    const animeCardsContainer = document.querySelector('.anime-cards-container');

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            if (!isLoading) {
                isLoading = true; // Mark as loading
                setTimeout(loadMoreAnimes, 2000); // Add 2-second delay before fetching
            }
        }
    });

    async function loadMoreAnimes() {
        currentPage++;
        try {
            const response = await fetch(`/category/new?page=${currentPage}`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const html = await response.text();
            animeCardsContainer.insertAdjacentHTML('beforeend', html);
        } catch (error) {
            console.error('Error fetching more anime data:', error);
        } finally {
            isLoading = false; // Allow new requests after completion
        }
    }
});