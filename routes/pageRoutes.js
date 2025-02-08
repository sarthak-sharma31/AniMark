import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import axios from "axios";
import User from "../models/userModel.js";
import NodeCache from 'node-cache';
import { delay } from '../utils/delay.js';

const router = express.Router();
const baseURL = "http://localhost:3000/api/anime";
const jikanURL = "https://api.jikan.moe/v4/anime";
const animeCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

router.get('/', async (req, res) => {
  try {
    // Fetch data from your API route
    const response = await axios.get(`${baseURL}/top-anime`);
    const popularAnime = response.data;

    res.render('index', {
      title: 'Welcome to Anime Marking Site!',
      animeList: popularAnime
    });
  } catch (error) {
    console.error('Error fetching popular anime:', error);
    res.render('index', {
      title: 'Welcome to Anime Marking Site!',
      animeList: []
    });
  }
});

router.get('/search', async (req, res) => {
  const query = req.query.query;
  try {
    const response = await axios.get(`${jikanURL}?q=${query}`);
    const searchResults = response.data.data;

    res.render('searchResults', {
      title: 'Search Results',
      searchResults: searchResults,
      query: query
    });
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.render('searchResults', {
      title: 'Search Results',
      searchResults: [],
      query: query
    });
  }
});

router.get('/anime/:id', authMiddleware, async (req, res) => {
  const animeId = req.params.id;
  const userId = req.user.id;

  try {
    const [animeResponse, userResponse] = await Promise.all([
      axios.get(`https://api.jikan.moe/v4/anime/${animeId}`),
      User.findById(userId)
    ]);

    const anime = animeResponse.data;
    const isInWatchlist = userResponse.watchlist.includes(animeId);
    const isMarked = userResponse.markedAnime.includes(animeId);

    // Ensure ongoingAnime and completedAnime fields are defined
    const ongoingAnime = userResponse.ongoingAnime ? userResponse.ongoingAnime.find(anime => anime.animeId === animeId) : null;
    const completedAnime = userResponse.completedAnime ? userResponse.completedAnime.find(anime => anime.animeId === animeId) : null;
    const lastWatchedEpisode = ongoingAnime ? ongoingAnime.lastWatchedEpisode : (completedAnime ? completedAnime.lastWatchedEpisode : 0);

    res.render('animeDetails', {
      title: anime.title,
      anime: anime.data,
      isInWatchlist: isInWatchlist,
      isMarked: isMarked,
      lastWatchedEpisode: lastWatchedEpisode
    });
  } catch (error) {
    console.error('Error fetching anime details:', error);
    res.render('animeDetails', {
      title: 'Anime Details',
      anime: null,
      isInWatchlist: false,
      isMarked: false,
      lastWatchedEpisode: 0
    });
  }
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.get('/profile', authMiddleware, (req, res) => {
  res.render('profile', { user: req.user });
});

router.get('/watchlist', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const watchlistDetails = await Promise.all(
      user.watchlist.map(async (animeId) => {
        try {
          const response = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
          return response.data.data;
        } catch (error) {
          console.error(`Error fetching details for anime ID ${animeId}:`, error);
          return null;
        }
      })
    );

    res.render('watchlist', {
      title: 'Your Watchlist',
      watchlist: watchlistDetails.filter(anime => anime !== null) // Filter out any null values
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.render('watchlist', {
      title: 'Your Watchlist',
      watchlist: [] // Pass empty array if there's an error
    });
  }
});

router.get('/markedAnime', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const markedAnimeDetails = await Promise.all(
      user.markedAnime.map(async (animeId) => {
        try {
          const response = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
          return response.data.data;
        } catch (error) {
          console.error(`Error fetching details for anime ID ${animeId}:`, error);
          return null;
        }
      })
    );

    res.render('markedAnime', {
      title: 'Marked Anime',
      markedAnime: markedAnimeDetails.filter(anime => anime !== null) // Filter out any null values
    });
  } catch (error) {
    console.error('Error fetching marked anime:', error);
    res.render('markedAnime', {
      title: 'Marked Anime',
      markedAnime: [] // Pass empty array if there's an error
    });
  }
});

router.get('/ongoingAnime', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ongoingAnimeDetails = [];

    for (const anime of user.ongoingAnime) {
      try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime/${anime.animeId}`);
        ongoingAnimeDetails.push(response.data.data);
        await delay(500); // Add a 500-millisecond delay between requests
      } catch (error) {
        console.error(`Error fetching details for anime ID ${anime.animeId}:`, error);
      }
    }

    res.render('ongoingAnime', {
      title: 'Ongoing Anime',
      ongoingAnime: ongoingAnimeDetails.filter(anime => anime !== null) // Filter out any null values
    });
  } catch (error) {
    console.error('Error fetching ongoing anime:', error);
    res.render('ongoingAnime', {
      title: 'Ongoing Anime',
      ongoingAnime: [] // Pass empty array if there's an error
    });
  }
});

router.get('/comments', authMiddleware, (req, res) => {
  res.render('comments');
});

export default router;
