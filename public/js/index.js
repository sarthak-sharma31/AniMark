document.addEventListener('DOMContentLoaded', () => {
	// Anime Card Click Event
	document.querySelectorAll('.a-card').forEach(card => {
	  card.addEventListener('click', () => {
		const animeId = card.dataset.id;
		window.location.href = `/anime/${animeId}`;
	  });
	});

	// Scroll Buttons for Anime Lists
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

	// Slider Functionality
	let currentIndex = 0;
	const slider = document.querySelector('.slider');
	const slides = document.querySelectorAll('.slide');
	const totalSlides = slides.length;

	function showSlide(index) {
	  if (index >= totalSlides) {
		currentIndex = 0;
	  } else if (index < 0) {
		currentIndex = totalSlides - 1;
	  } else {
		currentIndex = index;
	  }

	  // Get actual slide width dynamically
	  const slideWidth = slides[0].clientWidth;
	  slider.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
	}

	function nextSlide() {
	  showSlide(currentIndex + 1);
	}

	function prevSlide() {
	  showSlide(currentIndex - 1);
	}

	// Auto-slide every 5 seconds
	let slideInterval = setInterval(nextSlide, 5000);

	// Stop auto-slide on hover
	document.querySelector('.slider-wrapper').addEventListener('mouseover', () => {
	  clearInterval(slideInterval);
	});

	// Resume auto-slide when not hovering
	document.querySelector('.slider-wrapper').addEventListener('mouseleave', () => {
	  slideInterval = setInterval(nextSlide, 5000);
	});

	// Attach to navigation buttons
	document.querySelector('.slider-btn.left').addEventListener('click', prevSlide);
	document.querySelector('.slider-btn.right').addEventListener('click', nextSlide);
});
