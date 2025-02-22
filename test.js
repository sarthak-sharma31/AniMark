document.addEventListener('DOMContentLoaded', () => {
	const animeId = window.location.pathname.split('/').pop();
	const watchlistBtn = document.getElementById('watchlist-btn');
	const markBtn = document.getElementById('mark-btn');
	const episodeButtonsContainer = document.getElementById('episodes-container');
	const episodeRangeDropdown = document.getElementById('episode-range');
	const clearAllEpisodesBtn = document.getElementById('clear-all-episodes-btn');
	const lastWatchedEpisode = parseInt(document.getElementById('last-watched-episode').value) || 0;

	// Function to create episode buttons
	function createEpisodeButtons(start, end) {
	  episodeButtonsContainer.innerHTML = ''; // Clear existing buttons
	  for (let i = start; i <= end; i++) {
		const button = document.createElement('button');
		button.classList.add('episode-btn');
		button.textContent = i;
		button.classList.add(i <= lastWatchedEpisode ? 'watched' : '');
		button.addEventListener('click', async () => {
		  try {
			const response = await fetch('/api/user/ongoingAnime', {
			  method: 'POST',
			  headers: {
				'Content-Type': 'application/json'
			  },
			  body: JSON.stringify({ animeId, lastWatchedEpisode: i })
			});
			const result = await response.json();
			showPopUp(result);
			// Update button styles
			episodeButtonsContainer.querySelectorAll('.episode-btn').forEach(btn => {
			  btn.classList.remove('watched');
			  if (parseInt(btn.textContent) <= i) {
				btn.classList.add('watched');
			  }
			});
		  } catch (error) {
			console.error('Error marking episode:', error);
			showPopUp({ title: 'Error', message: 'Failed to mark episode.' });
		  }
		});
		episodeButtonsContainer.appendChild(button);
	  }
	}

	// Handle dropdown selection change
	episodeRangeDropdown.addEventListener('change', () => {
	  const [start, end] = episodeRangeDropdown.value.split('-').map(Number);
	  createEpisodeButtons(start, end);
	});

	// Initial episode buttons creation
	const [initialStart, initialEnd] = episodeRangeDropdown.value.split('-').map(Number);
	createEpisodeButtons(initialStart, initialEnd);

	// Watchlist Button Click Handler
	watchlistBtn.addEventListener('click', async () => {
	  const inWatchlist = watchlistBtn.getAttribute('data-in-watchlist') === 'true';
	  try {
		const response = await fetch('/api/user/watchlist', {
		  method: inWatchlist ? 'DELETE' : 'POST',
		  headers: {
			'Content-Type': 'application/json'
		  },
		  body: JSON.stringify({ animeId })
		});
		const result = await response.json();
		showPopUp(result);
		watchlistBtn.textContent = inWatchlist ? 'Add to Watchlist' : 'Remove from Watchlist';
		watchlistBtn.setAttribute('data-in-watchlist', !inWatchlist);
	  } catch (error) {
		console.error(`Error ${inWatchlist ? 'removing from' : 'adding to'} watchlist:`, error);
		showPopUp({ title: 'Error', message: `Failed to ${inWatchlist ? 'remove from' : 'add to'} watchlist.` });
	  }
	});

	// Mark Button Click Handler
	markBtn.addEventListener('click', async () => {
	  const isMarked = markBtn.getAttribute('data-marked') === 'true';
	  try {
		const response = await fetch('/api/user/markedAnime', {
		  method: isMarked ? 'DELETE' : 'POST',
		  headers: {
			'Content-Type': 'application/json'
		  },
		  body: JSON.stringify({ animeId })
		});
		const result = await response.json();
		showPopUp(result);
		markBtn.textContent = isMarked ? 'Mark Anime' : 'UnMark Anime';
		markBtn.setAttribute('data-marked', !isMarked);
	  } catch (error) {
		console.error(`Error ${isMarked ? 'unmarking' : 'marking'} anime:`, error);
		showPopUp({ title: 'Error', message: `Failed to ${isMarked ? 'unmark' : 'mark'} anime.` });
	  }
	});

	clearAllEpisodesBtn.addEventListener('click', async () => {
	  try {
		const response = await fetch('/api/user/clear-all-episodes', {
		  method: 'DELETE',
		  headers: {
			'Content-Type': 'application/json'
		  },
		  body: JSON.stringify({ animeId })
		});
		const result = await response.json();
		showPopUp(result);
		if (response.ok) {
		  episodeButtonsContainer.querySelectorAll('.episode-btn').forEach(btn => {
			btn.classList.remove('watched');
		  });
		  markBtn.textContent = 'Mark Anime';
		  markBtn.setAttribute('data-marked', false);
		}
	  } catch (error) {
		console.error('Error clearing all episodes:', error);
		showPopUp({ title: 'Error', message: 'Failed to clear all episodes.' });
	  }
	});

	// Add Comment
	document.getElementById('comment-form').addEventListener('submit', async (event) => {
	  event.preventDefault();
	  const commentText = document.getElementById('comment-text').value;
	  try {
		const response = await fetch('/api/comments', {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json'
		  },
		  body: JSON.stringify({ animeId, comment: commentText })
		});
		const result = await response.json();
		showPopUp(result);
		document.getElementById('comment-text').value = '';
		loadComments();
	  } catch (error) {
		console.error('Error adding comment:', error);
		showPopUp({ title: 'Error', message: 'Failed to add comment.' });
	  }
	});

	// Load Comments
	async function loadComments() {
	  try {
		const response = await fetch(`/api/comments/${animeId}`);
		const comments = await response.json();
		const commentsContainer = document.getElementById('comments-container');
		commentsContainer.innerHTML = '';
		comments.forEach(comment => {
		  const commentElement = document.createElement('div');
		  commentElement.classList.add('comment');
		  commentElement.innerHTML = `<p><strong>${comment.username}</strong> (${new Date(comment.date).toLocaleString()}):</p><p>${comment.comment}</p>`;
		  commentsContainer.appendChild(commentElement);
		});
	  } catch (error) {
		console.error('Error fetching comments:', error);
		showPopUp({ title: 'Error', message: 'Failed to fetch comments.' });
	  }
	}
	loadComments();
  });
