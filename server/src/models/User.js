import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 16,
      match: /^[a-zA-Z0-9_]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    avatarSeed: { type: String, required: true },
    // Game statistics (updated by the listeners in src/events/gameListeners.js)
    bestScore: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalAnswered: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
