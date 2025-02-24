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

    const newComment = { animeId, userId, comment };
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

    // Map comments to include the latest username from the user
    const result = comments.map(comment => ({
      _id: comment._id, // Include comment ID
      userId: comment.userId, // Include user ID for frontend check
      username: users.find(user => user._id.equals(comment.userId)).username,
      comment: comment.comment,
      date: comment.date
    }));


    res.json(result);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// Delete Comment
router.delete('/comments/:commentId', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { commentId } = req.params;

  try {
    const user = await User.findOne({ 'comments._id': commentId, 'comments.userId': userId });

    if (!user) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    // Remove the comment
    user.comments = user.comments.filter(comment => comment._id.toString() !== commentId);
    await user.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

export default router;
