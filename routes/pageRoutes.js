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
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

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

router.post('/share/static', authMiddleware, async (req, res) => {
  const { snapshotName, expiration, listType } = req.body;
  const userId = req.user.id; // Ensure user authentication is applied

  try {
    console.log('Incoming request:', { snapshotName, expiration, listType });

    const user = await User.findById(userId);
    if (!user) {
      console.log('Error: User not found!');
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user[listType]) {
      console.log(`Error: List type "${listType}" not found for the user.`);
      return res.status(404).json({ message: 'List not found.' });
    }

    const animeIds = user[listType];
    console.log('Anime IDs in the list:', animeIds);

    const staticLinkId = new mongoose.Types.ObjectId();
    const expirationDate = expiration === 'permanent'
      ? null
      : new Date(Date.now() + expiration * 24 * 60 * 60 * 1000);

    const staticLink = {
      id: staticLinkId,
      type: 'static',
      listType,
      animeIds,
      createdAt: new Date(),
      expiration: expirationDate,
      snapshotName: snapshotName || `${listType} Snapshot`
    };

    console.log('Generated static link:', staticLink);

    user.sharedLinks.push(staticLink);
    await user.save();

    const shareLink = `/shared/static/${staticLinkId}`;
    res.json({ shareLink });
  } catch (error) {
    console.error('Error occurred while creating static link:', error);
    res.status(500).json({ message: 'Error creating static link.' });
  }
});

router.get('/shared/static/:linkId', authMiddleware, async (req, res) => {
  const { linkId } = req.params;

  try {
    const user = await User.findOne({ 'sharedLinks.id': linkId });
    if (!user) {
      return res.status(404).json({ message: 'Link not found.' });
    }

    const staticLink = user.sharedLinks.find(link => link.id === linkId);
    if (!staticLink) {
      return res.status(404).json({ message: 'Static link not found.' });
    }

    if (staticLink.expiration && new Date() > staticLink.expiration) {
      return res.status(410).json({ message: 'This link has expired.' });
    }

    // Render the page instead of returning JSON
    res.render('sharedAnimeList', {
      title: staticLink.snapshotName,
      animeIds: staticLink.animeIds // Pass anime IDs for lazy loading
    });
  } catch (error) {
    console.error('Error fetching static link:', error);
    res.status(500).json({ message: 'Error fetching static link.' });
  }
});

router.get('/share/:linkId/:listType', authMiddleware, async (req, res) => {
  const { linkId, listType } = req.params;

  try {
    // Find the user where the dynamicLinks contain the given linkId
    const user = await User.findOne({
      $or: [
        { 'dynamicLinks.watchlist': `/share/${linkId}/watchlist` },
        { 'dynamicLinks.markedAnime': `/share/${linkId}/markedAnime` },
        { 'dynamicLinks.ongoingAnime': `/share/${linkId}/ongoingAnime` }
      ]
    });

    if (!user || !user[listType]) {
      return res.status(404).json({ message: 'List not found.' });
    }

    // Fetch details of the anime in the list
    const animeDetails = await Promise.all(
      user[listType].map(async (animeId) => {
        try {
          const response = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
          return response.data.data;
        } catch (error) {
          console.error(`Error fetching anime ID ${animeId}:`, error);
          return null;
        }
      })
    );

    res.render('sharedAnimeList', {
      title: `${listType} - Dynamic List`,
      animeList: animeDetails.filter(anime => anime !== null) // Exclude failed fetches
    });
  } catch (error) {
    console.error('Error fetching dynamic list:', error);
    res.status(500).json({ message: 'Error fetching dynamic list.' });
  }
});


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
    // Fetch anime details, user data, and related anime in parallel
    const [animeResponse, userResponse, relatedAnimeResponse] = await Promise.all([
      axios.get(`${jikanURL}/${animeId}`),
      User.findById(userId),
      axios.get(`https://api.jikan.moe/v4/anime/${animeId}/recommendations`)
    ]);

    const anime = animeResponse.data;
    const isInWatchlist = userResponse.watchlist.includes(animeId);
    const isMarked = userResponse.markedAnime.includes(animeId);

    // Ensure ongoingAnime and completedAnime fields are defined
    const ongoingAnime = userResponse.ongoingAnime
      ? userResponse.ongoingAnime.find(anime => anime.animeId === animeId)
      : null;
    const completedAnime = userResponse.completedAnime
      ? userResponse.completedAnime.find(anime => anime.animeId === animeId)
      : null;
    const lastWatchedEpisode = ongoingAnime
      ? ongoingAnime.lastWatchedEpisode
      : (completedAnime ? completedAnime.lastWatchedEpisode : 0);

    // Extract recommendations
    const relatedAnime = relatedAnimeResponse.data.data.map(rec => ({
      id: rec.entry.mal_id,
      title: rec.entry.title,
      image: rec.entry.images.jpg.image_url,
      url: rec.entry.url,
      votes: rec.votes
    }));

    // Render anime details along with related anime
    res.render('animeDetails', {
      title: anime.title,
      anime: anime.data,
      isInWatchlist,
      isMarked,
      lastWatchedEpisode,
      relatedAnime
    });
  } catch (error) {
    console.error('Error fetching anime details:', error);
    res.render('animeDetails', {
      title: 'Anime Details',
      anime: null,
      isInWatchlist: false,
      isMarked: false,
      lastWatchedEpisode: 0,
      relatedAnime: []
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
    const hashedPassword = await bcrypt.hash(password, 10);

    const dynamicLinks = {
      watchlist: `/share/${uuidv4()}/watchlist`,
      markedAnime: `/share/${uuidv4()}/markedAnime`,
      ongoingAnime: `/share/${uuidv4()}/ongoingAnime`
    };

    console.log('Generated Dynamic Links:', dynamicLinks); // Debugging

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      dynamicLinks // Assigning dynamicLinks
    });

    await newUser.save();
    console.log('User saved successfully:', newUser); // Debugging

    res.status(201).json({ status: 201, message: 'User registered successfully', dynamicLinks });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ status: 500, message: 'Error registering user' });
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

router.get('/manage-links', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have user authentication
    const user = await User.findById(userId).select('sharedLinks');

    res.render('manageLinks', {
      title: 'Manage Shared Links',
      sharedLinks: user.sharedLinks
    });
  } catch (error) {
    console.error('Error fetching shared links:', error);
    res.status(500).send('Error loading manage links page');
  }
});



router.get('/watchlist', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
      const user = await User.findById(userId);

      if (!user || !user.watchlist || user.watchlist.length === 0) {
          return res.render('watchlist', { title: "Watchlist", animeList: [], watchlistIds: [] });
      }

      // Watchlist anime IDs are stored directly in an array
      const watchlistIds = user.watchlist;
      const animeList = [];

      // Fetch the first 3 anime immediately
      for (const id of watchlistIds.slice(0, 3)) {
          try {
              const response = await axios.get(`https://api.jikan.moe/v4/anime/${id}`);
              animeList.push(response.data.data);
          } catch (fetchError) {
              if (!(fetchError.response && fetchError.response.status === 404)) {
                  console.error(`Error fetching anime ${id}:`, fetchError);
              }
          }
      }

      res.render('watchlist', { title: "Watchlist", animeList, watchlistIds });

  } catch (error) {
      console.error('Error fetching watchlist:', error);
      res.render('watchlist', { title: "Watchlist", animeList: [], watchlistIds: [] });
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
  //try {
  //  const response = await axios.get(`${jikanTop}?type=movie`);
  //  res.render('index', { title: 'Anime Movies', animeList: response.data.data });
  //} catch (error) {
  //  console.error('Error fetching anime movies:', error);
  //  res.render('index', { title: 'Anime Movies', animeList: [] });
  //}

  try {

    await delay(2000); // Add a 2-second delay before making the API call

    const response = await axios.get(`${jikanTop}?type=movie`);
    let paginatedAnime = response.data.data;

    if (req.query.page) {
        return res.render('partials/animeCardList', { animeList: paginatedAnime });
    }

    res.render('category', { title: 'Movies', animeList: paginatedAnime });
} catch (error) {
    console.error("Error fetching paginated anime:", error);
    res.status(500).send("Server Error");
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