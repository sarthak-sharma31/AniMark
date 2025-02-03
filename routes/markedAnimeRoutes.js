import express from "express";
import axios from "axios";
import User from "../models/userModel.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const baseURL = "https://api.jikan.moe/v4";

// Mark Anime as Completed
router.post('/markedAnime', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { animeId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.markedAnime.includes(animeId)) {
      user.markedAnime.push(animeId); // Store anime ID as string
      await user.save();
    }

    res.json({ message: 'Anime marked as completed' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking anime as completed' });
  }
});

// View Marked Anime
router.get('/markedAnime', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const markedAnimeDetails = await Promise.all(
      user.markedAnime.map(async (animeId) => {
        try {
          const response = await axios.get(`${baseURL}/anime/${animeId}`);
          return response.data.data;
        } catch (error) {
          console.error(`Error fetching details for anime ID ${animeId}:`, error);
          return null;
        }
      })
    );

    const validMarkedAnime = markedAnimeDetails.filter(anime => anime !== null);
    if (validMarkedAnime.length === 0) {
      return res.status(404).json({ message: 'No valid anime found in marked anime list' });
    }

    res.json(validMarkedAnime); // Filter out any null values
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marked anime' });
  }
});

// Remove from Marked Anime
router.delete('/markedAnime', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { animeId } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { markedAnime: animeId } }, // Remove anime ID from marked anime list
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Anime removed from marked anime list' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing anime from marked anime list' });
  }
});

export default router;
