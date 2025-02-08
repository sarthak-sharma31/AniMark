import express from 'express';
import User from '../models/userModel.js';
import authMiddleware from '../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const newUser = new User({ username, email, password });

    await newUser.save();
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

router.post('/update-username', authMiddleware, async (req, res) => {
  const { username } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    user.username = username;
    await user.save();

    // Fetch the updated user data
    const updatedUser = await User.findById(userId);

    res.render('profile', { user: updatedUser });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ message: 'Error updating username' });
  }
});

router.post('/update-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Fetch the updated user data
    const updatedUser = await User.findById(userId);

    res.render('profile', { user: updatedUser });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});


// Logout
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});


export default router;
