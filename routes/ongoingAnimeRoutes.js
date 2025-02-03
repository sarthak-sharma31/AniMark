import express from "express";
import axios from "axios";
import User from "../models/userModel.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const baseURL = "https://api.jikan.moe/v4";

// Add Ongoing Anime
router.post('/ongoingAnime', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { animeId, lastWatchedEpisode } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existingAnime = user.ongoingAnime.find(anime => anime.animeId === animeId);
    if (existingAnime) {
      existingAnime.lastWatchedEpisode = lastWatchedEpisode;
    } else {
      user.ongoingAnime.push({ animeId, lastWatchedEpisode }); // Store anime ID and last watched episode
    }

    await user.save();
    res.json({ message: 'Ongoing anime added/updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding/updating ongoing anime' });
  }
});

// View Ongoing Anime
router.get('/ongoingAnime', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ongoingAnimeDetails = await Promise.all(
      user.ongoingAnime.map(async (anime) => {
        try {
          const response = await axios.get(`${baseURL}/anime/${anime.animeId}`);
          return {
            ...response.data.data,
            lastWatchedEpisode: anime.lastWatchedEpisode
          };
        } catch (error) {
          console.error(`Error fetching details for anime ID ${anime.animeId}:`, error);
          return null;
        }
      })
    );

    const validOngoingAnime = ongoingAnimeDetails.filter(anime => anime !== null);
    if (validOngoingAnime.length === 0) {
      return res.status(404).json({ message: 'No valid ongoing anime found' });
    }

    res.json(validOngoingAnime); // Filter out any null values
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ongoing anime' });
  }
});

// Remove Ongoing Anime
router.delete('/ongoingAnime', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { animeId } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { ongoingAnime: { animeId } } }, // Remove anime ID from ongoingAnime
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Ongoing anime removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing ongoing anime' });
  }
});

export default router;
