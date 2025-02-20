document.addEventListener('DOMContentLoaded', () => {
	const animeId = window.location.pathname.split('/').pop();
	const watchlistBtn = document.getElementById('watchlist-btn');
	const markBtn = document.getElementById('mark-btn');
	const episodeButtons = document.querySelectorAll('.episode-btn');

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

		const commentsContainer = document.getElementById('comments-container');
		commentsContainer.innerHTML = '';

		comments.forEach(comment => {
		  const commentElement = document.createElement('div');
		  commentElement.classList.add('comment');
		  commentElement.innerHTML = `
			<p><strong>${comment.username}</strong> (${new Date(comment.date).toLocaleString()}):</p>
			<p>${comment.comment}</p>
		  `;
		  commentsContainer.appendChild(commentElement);
		});
	  } catch (error) {
		console.error('Error fetching comments:', error);
		//alert('Failed to fetch comments.');
		showPopUp({ title: 'Error', message:  `Failed to fetch comments.`});
	  }
	}

	// Load comments on page load
	loadComments();
  });