document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.a-card').forEach(card => {
	  card.addEventListener('click', () => {
		const animeId = card.dataset.id;
		window.location.href = `/anime/${animeId}`;
	  });
	});

	// Ensure scroll buttons work
	document.querySelectorAll('.scroll-button').forEach(button => {
	  button.addEventListener('click', (event) => {
		const container = event.target.closest('.anime-list-container').querySelector('.anime-list');
		if (!container) return;

		const scrollAmount = container.clientWidth / 2;
		if (event.target.classList.contains('left')) {
		  container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
		} else {
		  container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
		}
	  });
	});
  });


  function scrollLeft(containerSelector) {
	const container = document.querySelector(containerSelector);
	console.log("Scrolling Left:", container);
	if (container) {
	  container.scrollBy({ left: -container.clientWidth / 2, behavior: 'smooth' });
	}
  }

  function scrollRight(containerSelector) {
	const container = document.querySelector(containerSelector);
	console.log("Scrolling Right:", container);
	if (container) {
	  container.scrollBy({ left: container.clientWidth / 2, behavior: 'smooth' });
	}
  }
