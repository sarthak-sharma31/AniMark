document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.anime-card').forEach(card => {
	  card.addEventListener('click', () => {
		const animeId = card.dataset.id;
		window.location.href = `/anime/${animeId}`;
	  });
	});
  });
