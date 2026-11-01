import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const accuracy = (u) => (u.totalAnswered ? Math.round((u.totalCorrect / u.totalAnswered) * 100) : 0);
const endedLabel = { lives: 'Out of lives', quit: 'Ended early' };

export default function Home() {
  const { user } = useAuth();
  const [games, setGames] = useState(null);
  useEffect(() => {
    api.games().then((d) => setGames(d.games)).catch(() => setGames([]));
  }, []);

  return (
    <div className="grid-2">
      <section>
        <div className="card play-card">
          <h2>Welcome back, {user.username}</h2>
          <p className="muted">Solve the banana puzzle by finding the missing digit. Three lives per run.</p>
          <Link to="/play" className="btn btn-primary">Play now</Link>
        </div>

        <div className="card">
          <h2>Recent runs</h2>
          {games === null ? (
            <div className="spinner" />
          ) : games.length === 0 ? (
            <p className="muted empty">No runs yet. Your finished games will show up here.</p>
          ) : (
            <ul className="list">
              {games.map((g) => (
                <li key={g._id}>
                  <strong className="score">{g.score}</strong>
                  <div className="grow">
                    <span>{g.correct} correct, {g.wrong} wrong</span>
                    <small>{endedLabel[g.endedBy]} · best streak {g.bestStreak}</small>
                  </div>
                  <small>{new Date(g.createdAt).toLocaleDateString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <aside>
        <div className="card">
          <h2>Your stats</h2>
          <div className="stats">
            <div><strong>{user.bestScore}</strong><small>Best score</small></div>
            <div><strong>{user.bestStreak}</strong><small>Best streak</small></div>
            <div><strong>{user.gamesPlayed}</strong><small>Runs</small></div>
            <div><strong>{accuracy(user)}%</strong><small>Accuracy</small></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
