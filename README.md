# Banana Arena

A MERN game built around the external **Banana API**. Each round shows a puzzle image with a missing
digit; the player picks the answer from four options. Players register, log in, build streaks and
compete on a leaderboard.

## Run it

Requirements: Node 18+ and MongoDB (local or Atlas).

```bash
npm run install:all
cp server/.env.example server/.env     # set JWT_SECRET and MONGO_URI
npm run dev:server                     # http://localhost:5000
npm run dev:client                     # http://localhost:5173
npm test                               # 26 unit tests (game rules, option generator, Banana client)
```

## Game rules

- A run starts with 3 lives.
- A correct answer scores 10 points, plus 2 per consecutive correct answer (bonus capped at +10).
- A wrong answer costs a life, resets the streak, and shows the right answer.
- The run ends at 0 lives, or earlier with "End run and save score". Finished runs update the
  player's best score, best streak, run count and accuracy, and appear on the leaderboard.
- Refreshing the page resumes the run in progress. Keys 1-4 pick an answer.

## Structure

```
server/src
  config/        env + MongoDB connection
  models/        User, Game (Mongoose)
  controllers/   auth, game, stats
  routes/        route table + rate limiting
  middleware/    JWT cookie auth, error handling
  game/          rules.js (constants + scoring), options.js (answer options), gameService.js (the game logic)
  events/        gameEvents.js (event bus), gameListeners.js (persistence handlers)
  services/      bananaClient.js (external Banana API), avatarService.js (DiceBear API)
server/tests     node:test unit tests
client/src       api/ context/ components/ pages/ (Home, Play, Leaderboard, AuthPage) styles/
```

REST endpoints (all except auth need a login cookie): `POST /api/game/start`, `GET /api/game/question`,
`POST /api/game/answer`, `POST /api/game/end`, `GET /api/stats/leaderboard`, `GET /api/stats/games`.

## The four assignment themes

- **Version control**: the code is split by responsibility (rules, option generation, game service, event
  listeners, API client, controllers, UI pages), so each part can change in its own small commit or
  branch. Suggested workflow: `main` plus feature branches (`feature/banana-client`, `feature/game-service`,
  `feature/ui`), small commits, a tag per milestone. Initialise Git and commit as you go; the history is
  what the marker will look at.
- **Event-driven programming**:
  - Server: `GameService` emits `answer:checked` and `game:finished` (`events/gameEvents.js`); listeners in
    `events/gameListeners.js` update the user's stats and store the finished run. `emitAsync` waits for
    listeners so the response is only sent once the database is updated, and a failing listener cannot
    break a game.
  - Client: click handlers on answer buttons, a `keydown` listener (1-4), image `onLoad`, feedback timers
    and async API responses drive the state machine in `pages/Play.jsx`.
- **Interoperability**: `services/bananaClient.js` calls the Banana API
  (`https://marcconrad.com/uob/banana/api.php?out=json&base64=no`) over HTTPS and receives JSON
  `{ question, solution }`. The server validates the response, uses a 5 s timeout and one retry, and returns
  a 502 if the service is down. Avatars come from a second third-party service (DiceBear, SVG over HTTPS)
  via `services/avatarService.js`, with a local fallback.
- **Virtual identity**: passwords are hashed with bcrypt (`controllers/authController.js`); a JWT is stored in
  an httpOnly, sameSite cookie (`middleware/auth.js`) so scripts cannot read it. Every game route requires
  that cookie, and each player's run, score and statistics are tied to their account. Because the solution
  stays on the server, a player cannot read it from the browser or edit their own score.

## Sources and AI assistance (declare this in your submission)

- Game idea, Banana API endpoint and response shape, and the answer-generation approach are based on the
  reference project **keshavroka55/banana** (https://github.com/keshavroka55/banana, `client/js/script.js`).
  `game/options.js`, `services/bananaClient.js`, `game/gameService.js` and `client/src/pages/Play.jsx` carry
  header comments saying what was taken from it and what was changed.
- Banana API: University of Bedfordshire example resource, https://marcconrad.com/uob/banana/doc.php
- Avatars: DiceBear (https://www.dicebear.com). Libraries: Express, Mongoose, bcryptjs, jsonwebtoken,
  helmet, cors, express-rate-limit, React, React Router, Vite.
- Code in this repository was drafted with Claude (Anthropic). The brief allows AI for code but not for the
  video, which must be your own voice. Review every file so you can explain it, and mark which parts are
  yours in the comments.
