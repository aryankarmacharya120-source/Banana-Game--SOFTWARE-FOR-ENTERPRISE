import mongoose from 'mongoose';

const playerSub = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: String,
    color: { type: String, enum: ['red', 'yellow'] },
    ratingChange: Number,
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    players: [playerSub],
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    result: { type: String, enum: ['win', 'draw', 'forfeit'], required: true },
    moves: Number,
  },
  { timestamps: true }
);

export default mongoose.model('Match', matchSchema);
