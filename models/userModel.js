import mongoose from "mongoose";

const ongoingAnimeSchema = new mongoose.Schema({
  animeId: { type: String, required: true },
  lastWatchedEpisode: { type: Number, required: true }
});

const commentSchema = new mongoose.Schema({
  animeId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const sharedLinkSchema = new mongoose.Schema({
  id: { type: String}, // Unique link ID
  type: { type: String, enum: ['dynamic', 'static'], required: true }, // Link type: dynamic or static
  listType: { type: String, enum: ['watchlist', 'markedAnime', 'ongoingAnime'], required: true }, // List type
  animeIds: [{ type: String }], // For static links, store snapshot anime IDs
  createdAt: { type: Date, default: Date.now }, // Timestamp for creation
  expiration: { type: Date }, // Optional expiration for static links
  snapshotName: { type: String } // Optional custom name for static links
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: 'default_image_url' },
  watchlist: [{ type: String }],
  markedAnime: [{ type: String }],
  ongoingAnime: [ongoingAnimeSchema],
  comments: [commentSchema],
  sharedLinks: { type: [sharedLinkSchema], default: [] }, // ✅ Ensure empty array by default
  dynamicLinks: {
    watchlist: { type: String, default: '' },
    markedAnime: { type: String, default: '' },
    ongoingAnime: { type: String, default: '' }
  }
});

const User = mongoose.model('User', userSchema);
export default User;
