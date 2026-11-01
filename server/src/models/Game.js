import mongoose from 'mongoose';

// One finished run of the Banana game.
const gameSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    username: { type: String, required: true },
    score: { type: Number, required: true },
    correct: { type: Number, required: true },
    wrong: { type: Number, required: true },
    bestStreak: { type: Number, default: 0 },
    endedBy: { type: String, enum: ['lives', 'quit'], required: true },
    durationMs: Number,
  },
  { timestamps: true }
);

export default mongoose.model('Game', gameSchema);
