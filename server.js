import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import sharedLinkRoutes from "./routes/sharedLinks.js";
import animeRoutes from "./routes/animeRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import markedAnimeRoutes from "./routes/markedAnimeRoutes.js";
import ongoingAnimeRoutes from "./routes/ongoingAnimeRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import session from "express-session";
import passport from './config/passportConfig.js';
import jwtMiddleware from "./middleware/jwtMiddleware.js"; // Import the JWT middleware
import User from "./models/userModel.js";

dotenv.config();

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize session and passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// Apply JWT middleware
app.use(jwtMiddleware);

// Middleware to pass user data and profile image to all templates
app.use(async (req, res, next) => {
  res.locals.user = req.user || null;

  if (req.user) {
    try {
      const user = await User.findById(req.user.id);
      res.locals.dbProfileImage = user.profileImage || '/images/anime-characters/default.jpg';
    } catch (error) {
      res.locals.dbProfileImage = '/images/anime-characters/default.jpg';
    }
  } else {
    res.locals.dbProfileImage = '/images/anime-characters/default.jpg';
  }
  next();
});


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/user', watchlistRoutes);
app.use('/api/user', markedAnimeRoutes);
app.use('/api/user', ongoingAnimeRoutes);
app.use('/api/user', profileRoutes);
app.use('/api', commentRoutes);
app.use('/', pageRoutes);
app.use('/', userRoutes);
app.use('/', sharedLinkRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

app.get('/', (req, res) => {
  res.render('index', { title: 'Welcome to Anime Marking Site!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
