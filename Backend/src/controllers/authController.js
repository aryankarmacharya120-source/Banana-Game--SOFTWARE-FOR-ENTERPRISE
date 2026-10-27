import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { COOKIE_NAME, setAuthCookie, signToken } from '../middleware/auth.js';

const publicUser = (u) => ({
  id: u._id,
  username: u.username,
  avatarSeed: u.avatarSeed,
  rating: u.rating,
  wins: u.wins,
  losses: u.losses,
  draws: u.draws,
});

export async function register(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username))
      return res.status(400).json({ message: 'Username must be 3-16 letters, numbers or _' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (exists) return res.status(409).json({ message: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, avatarSeed: username });
    setAuthCookie(res, signToken(user._id.toString()));
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).select('+passwordHash');
    const ok = user && (await bcrypt.compare(password || '', user.passwordHash));
    if (!ok) return res.status(401).json({ message: 'Invalid username or password' });
    setAuthCookie(res, signToken(user._id.toString()));
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}
