document.addEventListener('DOMContentLoaded', () => {
	const animeCardsContainer = document.querySelector('.anime-cards-container');

	const eventSource = new EventSource('/markedAnime');

	eventSource.onmessage = (event) => {
	  const anime = JSON.parse(event.data);
	  const animeCard = createAnimeCard(anime);
	  animeCardsContainer.appendChild(animeCard);
	};

	eventSource.addEventListener('end', () => {
	  eventSource.close();
	  console.log('All anime details have been fetched.');
	});

	eventSource.onerror = (error) => {
	  console.error('Error receiving event:', error);
	  eventSource.close();
	};

	function createAnimeCard(anime) {
	  const animeCard = document.createElement('div');
	  animeCard.classList.add('a-card');
	  animeCard.setAttribute('data-id', anime.mal_id);
	  animeCard.innerHTML = `
		<img src="${anime.images.jpg.image_url}" alt="${anime.title_english}" class="anim-img">
		<div class="anim-details">
		  <div class="a-status">${anime.status}</div>
		  <p class="tot-episodes">${anime.episodes >= 1 ? `${anime.episodes} episodes` : 'No Episodes'}</p>
		  <p class="anim-title">${anime.title_english}</p>
		  ${anime.scored_by > 0 ? `
			<div class="anim-rating">
			  <div class="anim-score">
				<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24">
				  <path stroke="orange" stroke-width="2" d="M11.083 5.104c.35-.8 1.485-.8 1.834 0l1.752 4.022a1 1 0 0 0 .84.597l4.463.342c.9.069 1.255 1.2.556 1.771l-3.33 2.723a1 1 0 0 0-.337 1.016l1.03 4.119c.214.858-.71 1.552-1.474 1.106l-3.913-2.281a1 1 0 0 0-1.008 0L7.583 20.8c-.764.446-1.688-.248-1.474-1.106l1.03-4.119A1 1 0 0 0 6.8 14.56l-3.33-2.723c-.698-.571-.342-1.702.557-1.771l4.462-.342a1 1 0 0 0 .84-.597l1.753-4.022Z" />
				</svg>
				${anime.score}
				<p class="anim-users sma-txt">${anime.scored_by} users</p>
			  </div>
			  <div class="anim-rking">
				<div class="anim-ranking">#${anime.rank}</div>
				<p class="sma-txt">ranking</p>
			  </div>
			</div>
		  ` : ''}
		  <div class="anim-genres">
			${anime.genres.slice(0, 2).map(genre => `<div class="a-genre">${genre.name}</div>`).join('')}
			${anime.genres.length > 2 ? `<div class="a-genre">+${anime.genres.length - 2}</div>` : ''}
		  </div>
		</div>
	  `;
	  return animeCard;
	}
  });
