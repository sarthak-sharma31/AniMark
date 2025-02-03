import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'Welcome to Anime Marking Site!' });
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

router.get('/watchlist',authMiddleware, (req, res) => {
  res.render('watchlist');
});

router.get('/markedAnime', authMiddleware, (req, res) => {
  res.render('markedAnime');
});

router.get('/ongoingAnime', authMiddleware, (req, res) => {
  res.render('ongoingAnime');
});

router.get('/comments', authMiddleware, (req, res) => {
  res.render('comments');
});

export default router;
