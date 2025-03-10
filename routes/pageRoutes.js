import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import axios from "axios";
import User from "../models/userModel.js";
import NodeCache from 'node-cache';
import { delay } from '../utils/delay.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const router = express.Router();
const baseURL = "http://localhost:3000/api/anime";
const jikanURL = "https://api.jikan.moe/v4/anime";
const jikanTop = "https://api.jikan.moe/v4/top/anime";
const animeCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbProfileImage = '/images/anime-characters/zoro.jpg';

// Function to get a random image from the anime character directory
function getRandomAnimeImage() {
  const imagesDir = path.join(__dirname, '../public/images/anime-characters');
  const files = fs.readdirSync(imagesDir);
  const randomIndex = Math.floor(Math.random() * files.length);
  return `/images/anime-characters/${files[randomIndex]}`;
}

router.get('/anime/:id/episodes', async (req, res) => {
  const animeId = req.params.id;

  try {
    const response = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}/videos/episodes`);
    res.json(response.data.data);
  } catch (error) {
    console.error('Error fetching anime episodes:', error);
    res.status(500).json({ message: 'Error fetching anime episodes' });
  }
});

router.get('/animeCard/:id', async (req, res) => {
    try {
        const animeId = req.params.id;
        const response = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
        const anime = response.data.data;

        // Render the anime card partial and send the HTML
        res.render('partials/animeCard', { anime }, (err, html) => {
            if (err) {
                console.error('Error rendering anime card:', err);
                return res.status(500).send('');
            }
            res.send(html);
        });
    } catch (error) {
        console.error(`Error fetching anime ID ${req.params.id}:`, error);
        res.status(500).send('');
    }
});


router.get('/category/new', async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;

        await delay(2000); // Add a 2-second delay before making the API call

        const response = await axios.get(`https://api.jikan.moe/v4/seasons/now?page=${page}&sfw`);
        let paginatedAnime = response.data.data;

        if (req.query.page) {
            return res.render('partials/animeCardList', { animeList: paginatedAnime });
        }

        res.render('category', { title: 'New Anime', animeList: paginatedAnime });
    } catch (error) {
        console.error("Error fetching paginated anime:", error);
        res.status(500).send("Server Error");
    }
});


router.get('/', async (req, res) => {
  try {
    // Fetch data for new anime
    const newAnimeResponse = await axios.get(`https://api.jikan.moe/v4/seasons/now?sfw`);
    const newAnime = newAnimeResponse.data.data;

    // Use the first 4 or 5 anime for the slider
    const sliderData = newAnime.slice(0, 5);

    // Use the rest for new releases
    const newReleases = newAnime.slice(5);

    // Fetch data for popular anime
    const popularAnimeResponse = await axios.get(`${jikanTop}`);
    const popularAnime = popularAnimeResponse.data.data;

    res.render('index', {
      title: 'Welcome to Anime Marking Site!',
      sliderData,
      newReleases,
      popularAnime
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.render('index', {
      title: 'Welcome to Anime Marking Site!',
      sliderData: [],
      newReleases: [],
      popularAnime: []
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
      axios.get(`${jikanURL}/${animeId}`),
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

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      profileImage: getRandomAnimeImage() // Assign random anime image
    });

    await newUser.save();
    dbProfileImage = newUser.profileImage; // Update global variable
    res.redirect('/login');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    const imagesDir = path.join(__dirname, '../public/images/anime-characters');
    const images = fs.readdirSync(imagesDir);
    res.render('profile', { user, images });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

router.post('/update-profile-photo', authMiddleware, async (req, res) => {
  const { profileImage } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    user.profileImage = profileImage;
    await user.save();
    dbProfileImage = profileImage; // Update global variable
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile photo:', error);
    res.status(500).json({ message: 'Error updating profile photo' });
  }
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

router.get('/ongoingAnime', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
      const user = await User.findById(userId);

      if (!user || !user.ongoingAnime || user.ongoingAnime.length === 0) {
          return res.render('ongoingAnime', { title: "Ongoing Anime", animeList: [], ongoingAnimeIds: [] });
      }

      // Extract anime IDs correctly
      const ongoingAnimeIds = user.ongoingAnime.map(animeObj => animeObj.animeId);
      const animeList = [];

      // Fetch the first 3 anime immediately
      for (const id of ongoingAnimeIds.slice(0, 3)) {
          try {
              const response = await axios.get(`https://api.jikan.moe/v4/anime/${id}`);
              animeList.push(response.data.data);
          } catch (fetchError) {
              if (!(fetchError.response && fetchError.response.status === 404)) {
                  console.error(`Error fetching anime ${id}:`, fetchError);
              }
          }
      }

      res.render('ongoingAnime', { title: "Ongoing Anime", animeList, ongoingAnimeIds });

  } catch (error) {
      console.error('Error fetching ongoing anime:', error);
      res.render('ongoingAnime', { title: "Ongoing Anime", animeList: [], ongoingAnimeIds: [] });
  }
});




router.get('/markedAnime', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
      const user = await User.findById(userId);

      if (!user || !user.markedAnime || user.markedAnime.length === 0) {
          return res.render('markedAnime', { title: "Marked Anime", animeList: [], markedAnimeIds: [] });
      }

      const markedAnimeIds = user.markedAnime;
      const animeList = [];

      // Fetch the first 3 anime immediately
      for (const id of markedAnimeIds.slice(0, 3)) {
          try {
              const response = await axios.get(`https://api.jikan.moe/v4/anime/${id}`);
              animeList.push(response.data.data);
          } catch (fetchError) {
              console.error(`Error fetching anime ${id}:`, fetchError);
          }
      }

      res.render('markedAnime', { title: "Marked Anime", animeList, markedAnimeIds });

  } catch (error) {
      console.error('Error fetching marked anime:', error);
      res.render('markedAnime', { title: "Marked Anime", animeList: [], markedAnimeIds: [] });
  }
});




router.get('/fetchAnime', async (req, res) => {
  const animeId = req.query.id;

  try {
      const response = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
      const anime = response.data.data;

      res.render('partials/animeCard', { anime }, (err, html) => {
          if (err) {
              console.error("Error rendering animeCard:", err);
              return res.status(500).send("Error loading anime");
          }
          res.send(html);
      });

  } catch (error) {
      console.error(`Error fetching anime ${animeId}:`, error);
      res.status(500).send("Failed to load anime");
  }
});



router.get('/category/movies', async (req, res) => {
  try {
    const response = await axios.get(`${jikanTop}?type=movie`);
    res.render('index', { title: 'Anime Movies', animeList: response.data.data });
  } catch (error) {
    console.error('Error fetching anime movies:', error);
    res.render('index', { title: 'Anime Movies', animeList: [] });
  }
});

router.get('/category/ona', async (req, res) => {
  try {
    const response = await axios.get(`${jikanTop}?type=ona`);
    res.render('index', { title: 'ONA', animeList: response.data.data });
  } catch (error) {
    console.error('Error fetching anime movies:', error);
    res.render('index', { title: 'ONA', animeList: [] });
  }
});

router.get('/category/ova', async (req, res) => {
  try {
    const response = await axios.get(`${jikanTop}?type=ova`);
    res.render('index', { title: 'OVA', animeList: response.data.data });
  } catch (error) {
    console.error('Error fetching anime movies:', error);
    res.render('index', { title: 'OVA', animeList: [] });
  }
});
router.get('/category/upcoming', async (req, res) => {
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/seasons/upcoming`);
    res.render('index', { title: 'Upcoming Anime', animeList: response.data.data });
  } catch (error) {
    console.error('Error fetching anime movies:', error);
    res.render('index', { title: 'Upcoming Anime', animeList: [] });
  }
});
router.get('/category/top', async (req, res) => {
  try {
    const response = await axios.get(`${jikanTop}?sfw`);
    res.render('category', { title: 'Top Anime', animeList: response.data.data });
  } catch (error) {
    console.error('Error fetching Top Anime:', error);
    res.render('index', { title: 'Top Anime', animeList: [] });
  }
});
router.get('/category/summer', async (req, res) => {
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/seasons/2024/summer?sfw`);
    res.render('index', { title: 'Summer Anime', animeList: response.data.data });
  } catch (error) {
    console.error('Error fetching anime:', error);
    res.render('index', { title: 'Summer Anime', animeList: [] });
  }
});

router.get('/category/winter', async (req, res) => {
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/seasons/2024/winter?sfw`);
    res.render('index', { title: 'Winter Anime', animeList: response.data.data });
  } catch (error) {
    console.error('Error fetching anime:', error);
    res.render('index', { title: 'Winter Anime', animeList: [] });
  }
});


router.get('/category/spring', async (req, res) => {
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/seasons/2024/spring?sfw`);
    res.render('index', { title: 'Spring Anime', animeList: response.data.data });
  } catch (error) {
    console.error('Error fetching anime:', error);
    res.render('index', { title: 'Spring Anime', animeList: [] });
  }
});

router.get('/forgot-password', (req, res) => {
  res.render('forgotPassword');
});

router.get('/comments', authMiddleware, (req, res) => {
  res.render('comments');
});

export default router;


//https://api.jikan.moe/v4/seasons/2024/summer?sfw
//https://api.jikan.moe/v4/seasons/2014/winter?sfw
//https://api.jikan.moe/v4/seasons/2009/spring?sfw

//https://api.jikan.moe/v4/top/anime?sfw
//https://api.jikan.moe/v4/top/anime?type=movie
//https://api.jikan.moe/v4/top/anime?type=ona
//https://api.jikan.moe/v4/top/anime?type=ova
//https://api.jikan.moe/v4/seasons/upcoming