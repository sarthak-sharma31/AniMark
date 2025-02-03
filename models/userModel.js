import mongoose from "mongoose";

const ongoingAnimeSchema = new mongoose.Schema({
  animeId: { type: String, required: true },
  lastWatchedEpisode: { type: Number, required: true }
});

const commentSchema = new mongoose.Schema({
  animeId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  watchlist: [{ type: String }],
  markedAnime: [{ type: String }],
  ongoingAnime: [ongoingAnimeSchema],
  comments: [commentSchema] // Add comments field
});

const User = mongoose.model('User', userSchema);
export default User;
