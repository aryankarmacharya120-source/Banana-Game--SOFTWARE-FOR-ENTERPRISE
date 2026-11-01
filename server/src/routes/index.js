import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, me } from '../controllers/authController.js';
import { leaderboard, myGames } from '../controllers/statsController.js';
import * as game from '../controllers/gameController.js';
import { requireAuth } from '../middleware/auth.js';
import { getAvatar } from '../services/avatarService.js';

const router = Router();

const limiter = (limit, windowMs) => rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false });
const authLimiter = limiter(50, 15 * 60 * 1000);
// Every new question is one call to the third-party Banana API, so keep it polite.
const gameLimiter = limiter(120, 60 * 1000);

// Virtual identity
router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);
router.post('/auth/logout', logout);
router.get('/auth/me', requireAuth, me);

// Game (all routes need a logged-in player)
router.post('/game/start', requireAuth, gameLimiter, game.start);
router.get('/game/question', requireAuth, gameLimiter, game.question);
router.post('/game/answer', requireAuth, gameLimiter, game.answer);
router.post('/game/end', requireAuth, gameLimiter, game.end);

router.get('/stats/leaderboard', requireAuth, leaderboard);
router.get('/stats/games', requireAuth, myGames);

// Interoperability: proxies a second third-party web service (DiceBear) over HTTPS/REST.
router.get('/avatar/:seed', getAvatar);

export default router;
