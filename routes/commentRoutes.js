import express from "express";
import User from "../models/userModel.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Post Comment
router.post('/comments', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { animeId, comment } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    const newComment = { animeId, userId, username: user.username, comment };
    user.comments.push(newComment);
    await user.save();

    res.json({ message: 'Comment posted successfully' });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ message: 'Error posting comment' });
  }
});

// View Comments for an Anime
router.get('/comments/:animeId', async (req, res) => {
  const { animeId } = req.params;

  try {
    const users = await User.find({ 'comments.animeId': animeId });

    // Flatten the comments array and filter by animeId
    const comments = users.flatMap(user =>
      user.comments.filter(comment => comment.animeId === animeId)
    );

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

export default router;
