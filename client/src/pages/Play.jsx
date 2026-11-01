/**
 * The game screen.
 *
 * REFERENCE: the interaction flow (question image, four answer buttons, immediate feedback,
 * score, automatic next question) follows keshavroka55/banana (client/js/script.js). The
 * reference keeps the solution in the browser; here the server owns the game state and this
 * component only renders it and reports the player's choices.
 *
 * EVENT-DRIVEN PROGRAMMING (client side): click handlers on the answer buttons, a window
 * `keydown` listener (keys 1-4), image `onLoad`, timers for the feedback delay, and async
 * responses from the API all drive the state machine below.
 *
 * AI assistance: drafted with Claude (Anthropic) and reviewed by the author.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const FEEDBACK_MS = { correct: 900, wrong: 1700, over: 1700 };

// phase: loading -> idle | question -> checking -> feedback -> (loading | over) ; error
export default function Play() {
  const { user, refresh } = useAuth();
  const [phase, setPhase] = useState('loading');
  const [game, setGame] = useState(null); // what the server lets us see: score, lives, streak, question
  const [feedback, setFeedback] = useState(null);
  const [summary, setSummary] = useState(null);
  const [newBest, setNewBest] = useState(false);
  const [error, setError] = useState('');
  const [imgReady, setImgReady] = useState(false);
  const timer = useRef(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  const showQuestion = (state) => {
    setGame(state);
    setFeedback(null);
    setImgReady(false);
    setPhase('question');
  };

  // Loads the current question. Also resumes a run after a page refresh; 404 means "no run yet".
  const loadQuestion = useCallback(async () => {
    setPhase('loading');
    setError('');
    try {
      const { state } = await api.question();
      if (alive.current) showQuestion(state);
    } catch (err) {
      if (!alive.current) return;
      if (err.status === 404) return setPhase('idle');
      setError(err.message);
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const start = async () => {
    clearTimeout(timer.current);
    setGame(null);
    setSummary(null);
    setNewBest(false);
    setPhase('loading');
    setError('');
    try {
      const { state } = await api.startGame();
      if (alive.current) showQuestion(state);
    } catch (err) {
      if (!alive.current) return;
      setError(err.message); // the run exists on the server, so "Try again" can fetch the question
      setPhase('error');
    }
  };

  const finish = useCallback(
    (result) => {
      setNewBest(result.score > user.bestScore && result.score > 0);
      setSummary(result);
      setPhase('over');
      refresh(); // pull the updated personal bests for the navbar
    },
    [user.bestScore, refresh]
  );

  const submit = useCallback(
    async (value) => {
      if (phase !== 'question' || !game?.question) return;
      setPhase('checking');
      try {
        const res = await api.answer(game.question.id, value);
        setFeedback({ correct: res.correct, correctAnswer: res.correctAnswer, picked: value, points: res.points, gameOver: res.gameOver });
        setGame((g) => ({ ...res.state, question: g.question })); // keep the picture on screen during feedback
        setPhase('feedback');
        if (res.gameOver) {
          timer.current = setTimeout(() => finish(res.summary), FEEDBACK_MS.over);
        } else {
          timer.current = setTimeout(loadQuestion, res.correct ? FEEDBACK_MS.correct : FEEDBACK_MS.wrong);
        }
      } catch (err) {
        if (err.status === 409) return loadQuestion(); // out of sync with the server: just resync
        if (err.status === 404) return setPhase('idle');
        setError(err.message);
        setPhase('error');
      }
    },
    [phase, game, finish, loadQuestion]
  );

  const endRun = async () => {
    clearTimeout(timer.current);
    try {
      const { summary } = await api.endGame();
      finish(summary);
    } catch (err) {
      if (err.status === 404) return setPhase('idle');
      setError(err.message);
      setPhase('error');
    }
  };

  // Keyboard shortcuts: 1-4 pick the matching answer.
  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'question' || !game?.question) return;
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < game.question.options.length) submit(game.question.options[i]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, game, submit]);

  // ---- screens -------------------------------------------------------------------------

  if (phase === 'loading' && !game) return <div className="center-screen"><div className="spinner" /></div>;

  if (phase === 'idle') {
    return (
      <div className="card narrow">
        <h2>Ready?</h2>
        <p className="muted">Find the missing digit in each banana puzzle. You have 3 lives. Correct answers score 10 points, and every answer in a row adds a bonus.</p>
        <button className="btn btn-primary" onClick={start}>Start run</button>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="card narrow">
        <h2>Something went wrong</h2>
        <div className="error">{error}</div>
        <div className="row">
          <button className="btn btn-primary" onClick={loadQuestion}>Try again</button>
          <Link to="/" className="btn btn-ghost">Back home</Link>
        </div>
      </div>
    );
  }

  if (phase === 'over' && summary) {
    return (
      <div className="card narrow over">
        <small className="muted">{summary.endedBy === 'lives' ? 'Out of lives' : 'Run ended'}</small>
        <h2 className="big-score">{summary.score}</h2>
        {newBest && <div className="badge-best">New personal best</div>}
        <div className="stats">
          <div><strong>{summary.correct}</strong><small>Correct</small></div>
          <div><strong>{summary.wrong}</strong><small>Wrong</small></div>
          <div><strong>{summary.bestStreak}</strong><small>Best streak</small></div>
        </div>
        <div className="row">
          <button className="btn btn-primary" onClick={start}>Play again</button>
          <Link to="/leaderboard" className="btn btn-ghost">Leaderboard</Link>
        </div>
      </div>
    );
  }

  if (!game?.question) return <div className="center-screen"><div className="spinner" /></div>;

  const { question } = game;
  const locked = phase !== 'question';

  const optionClass = (opt) => {
    if (!feedback) return '';
    if (opt === feedback.correctAnswer) return 'right';
    if (opt === feedback.picked) return 'wrong';
    return 'dim';
  };

  return (
    <div className="play">
      <div className="hud">
        <div><small>Score</small><strong>{game.score}</strong></div>
        <div><small>Streak</small><strong>{game.streak}</strong></div>
        <div className="lives" aria-label={`${game.lives} lives left`}>
          <small>Lives</small>
          <span>
            {Array.from({ length: game.maxLives }, (_, i) => (
              <i key={i} className={`pip ${i < game.lives ? '' : 'lost'}`} />
            ))}
          </span>
        </div>
      </div>

      <div className={`puzzle ${imgReady ? 'ready' : ''}`}>
        {!imgReady && <div className="spinner" />}
        <img key={question.id} src={question.imageUrl} alt="Banana puzzle: find the missing digit" onLoad={() => setImgReady(true)} onError={() => setImgReady(true)} />
      </div>

      <div className={`feedback ${feedback ? (feedback.correct ? 'good' : 'bad') : ''}`} role="status">
        {!feedback && 'Which digit is missing?'}
        {feedback?.correct && `Correct, +${feedback.points}`}
        {feedback && !feedback.correct && `Not quite. The answer was ${feedback.correctAnswer}.`}
        {feedback?.gameOver && ' No lives left.'}
      </div>

      <div className="answers">
        {question.options.map((opt, i) => (
          <button key={opt} className={`answer-btn ${optionClass(opt)}`} disabled={locked || !imgReady} onClick={() => submit(opt)}>
            <kbd>{i + 1}</kbd>
            {opt}
          </button>
        ))}
      </div>

      <button className="btn btn-ghost btn-sm end-run" onClick={endRun} disabled={phase === 'checking'}>
        End run and save score
      </button>
    </div>
  );
}
