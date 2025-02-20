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
      user.ongoingAnime.push({ animeId, lastWatchedEpisode }); // Add to ongoing list
    }

    // Add to marked list
    if (!user.markedAnime.includes(animeId)) {
      user.markedAnime.push(animeId);
    }

    await user.save();

    // Check if the anime is completed
    const response = await axios.get(`${baseURL}/anime/${animeId}`);
    const anime = response.data.data;

    if (lastWatchedEpisode === anime.episodes) {
      // Remove from ongoing list
      user.ongoingAnime = user.ongoingAnime.filter(anime => anime.animeId !== animeId);

      // Update marked anime with the last watched episode
      if (!user.completedAnime) user.completedAnime = [];
      user.completedAnime.push({ animeId, lastWatchedEpisode });

      await user.save();
    }

    res.json({ message: 'Ongoing anime added/updated successfully' });
  } catch (error) {
    console.error('Error adding/updating ongoing anime:', error);
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
    console.error('Error fetching ongoing anime:', error);
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
    console.error('Error removing ongoing anime:', error);
    res.status(500).json({ message: 'Error removing ongoing anime' });
  }
});

router.delete('/clear-all-episodes', authMiddleware, async (req, res) => {
  const { animeId } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { ongoingAnime: { animeId } } }, // Remove anime ID from ongoingAnime
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    res.status(200).json({ status: 200, message: 'Cleared all episodes and removed from ongoing anime' });
  } catch (error) {
    console.error('Error clearing all episodes:', error);
    res.status(500).json({ status: 500, message: 'Error clearing all episodes' });
  }
});

export default router;