document.addEventListener('DOMContentLoaded', () => {
	const animeId = window.location.pathname.split('/').pop();
	const watchlistBtn = document.getElementById('watchlist-btn');
	const markBtn = document.getElementById('mark-btn');
	const clearAllEpisodesBtn = document.getElementById('clear-all-episodes-btn');
	const episodeButtons = document.querySelectorAll('.episode-btn');

	const episodeRangeDropdown = document.getElementById('episode-range');
  	const episodesContainer = document.getElementById('episodes-container');

	  function filterEpisodes() {
		const [start, end] = episodeRangeDropdown.value.split('-').map(Number);
		episodeButtons.forEach(button => {
		  const episodeNumber = Number(button.getAttribute('data-episode'));
		  button.style.display = (episodeNumber >= start && episodeNumber <= end) ? 'inline-block' : 'none';
		});
	  }

	  episodeRangeDropdown.addEventListener('change', filterEpisodes);

	  // Set initial filter
	  filterEpisodes();

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
		//alert(result.message);
		showPopUp(result);

		// Toggle button text and data attribute
		watchlistBtn.textContent = inWatchlist ? 'Add to Watchlist' : 'Remove from Watchlist';
		watchlistBtn.setAttribute('data-in-watchlist', !inWatchlist);
	  } catch (error) {
		console.error(`Error ${inWatchlist ? 'removing from' : 'adding to'} watchlist:`, error);
		//alert(`Failed to ${inWatchlist ? 'remove from' : 'add to'} watchlist.`);
		showPopUp({ title: 'Error', message:  `Failed to ${inWatchlist ? 'remove from' : 'add to'} watchlist.`});
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
		//alert(result.message);
		showPopUp(result);

		// Toggle button text and data attribute
		markBtn.textContent = isMarked ? 'Mark Anime' : 'UnMark Anime';
		markBtn.setAttribute('data-marked', !isMarked);
	  } catch (error) {
		console.error(`Error ${isMarked ? 'unmarking' : 'marking'} anime:`, error);
		//alert(`Failed to ${isMarked ? 'unmark' : 'mark'} anime.`);
		showPopUp({ title: 'Error', message:  `Failed to ${isMarked ? 'unmark' : 'mark'} anime.`});
	  }
	});

	// Episode Button Click Handler
	episodeButtons.forEach(button => {
	  button.addEventListener('click', async () => {
		const episodeNumber = parseInt(button.textContent);

		try {
		  const response = await fetch('/api/user/ongoingAnime', {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json'
			},
			body: JSON.stringify({ animeId, lastWatchedEpisode: episodeNumber })
		  });

		  const result = await response.json();
		//  alert(result.message);
		  showPopUp(result);

		  // Update button styles
		  episodeButtons.forEach(btn => {
			btn.classList.remove('watched');
			if (parseInt(btn.textContent) <= episodeNumber) {
			  btn.classList.add('watched');
			}
		  });

		  // Update mark button text if necessary
		  if (episodeNumber === episodeButtons.length) {
			markBtn.textContent = 'Mark Anime';
			markBtn.setAttribute('data-marked', false);
		  } else {
			markBtn.textContent = 'UnMark Anime';
			markBtn.setAttribute('data-marked', true);
		  }
		} catch (error) {
		  console.error('Error marking episode:', error);
		//  alert('Failed to mark episode.');
		showPopUp({ title: 'Error', message:  `Failed to mark episode.`});
		}
	  });
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
			// Update UI to reflect the clearing of all episodes
			episodeButtons.forEach(btn => {
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
		alert(result.message);
		showPopUp(result);

		// Clear the comment form
		document.getElementById('comment-text').value = '';

		// Fetch and display comments again
		loadComments();
	  } catch (error) {
		console.error('Error adding comment:', error);
		//alert('Failed to add comment.');
		showPopUp({ title: 'Error', message:  `Failed to add comment`});
	  }
	});

	// Load Comments
	async function loadComments() {
		try {
		  const response = await fetch(`/api/comments/${animeId}`);
		  const comments = await response.json();

		  console.log('Fetched comments:', comments); // Debugging line

		  const commentsContainer = document.getElementById('comments-container');
		  commentsContainer.innerHTML = '';

		  comments.forEach(comment => {
			console.log('Comment ID:', comment._id); // Debugging line

			const commentElement = document.createElement('div');
			commentElement.classList.add('comment');
			commentElement.innerHTML = `
			  <p><strong>${comment.username}</strong> (${new Date(comment.date).toLocaleString()}):</p>
			  <p>${comment.comment}</p>
			  <button class="delete-comment" data-comment-id="${comment._id}">🗑️</button>
			`;
			commentsContainer.appendChild(commentElement);
		  });

		  document.querySelectorAll('.delete-comment').forEach(button => {
			button.addEventListener('click', async (event) => {
			  const commentId = event.target.getAttribute('data-comment-id');
			  console.log('Deleting comment ID:', commentId); // Debugging line
			  if (!commentId) {
				console.error('Error: Comment ID is undefined!');
				return;
			  }
			  await deleteComment(commentId);
			});
		  });

		} catch (error) {
		  console.error('Error fetching comments:', error);
		  showPopUp({ title: 'Error', message: 'Failed to fetch comments.' });
		}
	  }

	  async function deleteComment(commentId) {
		try {
		  console.log('Sending delete request for comment ID:', commentId); // Debugging line

		  const response = await fetch(`/api/comments/${commentId}`, {
			method: 'DELETE',
			headers: {
			  'Content-Type': 'application/json'
			}
		  });

		  const result = await response.json();
		  console.log('Delete response:', result); // Debugging line
		  showPopUp(result);

		  // Reload comments after deletion
		  loadComments();
		} catch (error) {
		  console.error('Error deleting comment:', error);
		  showPopUp({ title: 'Error', message: 'Failed to delete comment.' });
		}
	  }

	// Load comments on page load
	loadComments();
  });