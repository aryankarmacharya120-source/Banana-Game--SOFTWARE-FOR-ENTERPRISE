import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, me } from '../controllers/authController.js';
import { leaderboard, myMatches } from '../controllers/statsController.js';
import { requireAuth } from '../middleware/auth.js';
import { getAvatar } from '../services/avatarService.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });

router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);
router.post('/auth/logout', logout);
router.get('/auth/me', requireAuth, me);

router.get('/stats/leaderboard', requireAuth, leaderboard);
router.get('/stats/matches', requireAuth, myMatches);

// Interoperability: proxies a third-party web service (DiceBear) over HTTPS/REST.
router.get('/avatar/:seed', getAvatar);

export default router;
