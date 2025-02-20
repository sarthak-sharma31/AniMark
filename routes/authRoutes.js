import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';
import User from "../models/userModel.js";

const router = express.Router();

// Registration endpoint
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ status: 201, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ status: 500, message: 'Error registering user' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ status: 400, message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ status: 400, message: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save token in session
    req.session.token = token;

    res.json({ status: 200, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ status: 500, message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    // Generate reset token
    const token = jwt.sign({email}, process.env.JWT_SECRET, {expiresIn:"1h"});

    // Nodemailer transporter configuration with OAuth
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      secure: 'true',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      }
    });

    const receiver = {
      from: 'Animark@gmail.com',
      to: email,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      http://${req.headers.host}/reset/${token}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    transporter.sendMail(receiver);

    return res.status(200).json({ status: 200, message: 'Password reset link sent' });

  } catch (error) {
    console.error('Error sending reset email:', error);
    res.status(500).json({ status: 500, message: 'Error sending reset email' });
  }
});

router.post('/resetPassword/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ status: 400, message: 'Please provide the password' });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decode.email });

    const newHashedPassword = await bcrypt.hash(password, 10);

    user.password = newHashedPassword;
    await user.save();

    return res.status(200).json({ status: 200, message: 'Password reset successful' });
  } catch (error) {
    return res.status(500).json({ status: 500, message: 'Something went wrong' });
  }
});

export default router;
