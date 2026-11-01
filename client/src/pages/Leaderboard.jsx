import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

const accuracy = (u) => (u.totalAnswered ? `${Math.round((u.totalCorrect / u.totalAnswered) * 100)}%` : '-');

export default function Leaderboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);

  useEffect(() => {
    api.leaderboard().then((d) => setUsers(d.users)).catch(() => setUsers([]));
  }, []);

  return (
    <div className="card leaderboard">
      <h2>Top players</h2>
      {users === null ? (
        <div className="spinner" />
      ) : users.length === 0 ? (
        <p className="muted empty">Nobody is ranked yet. Finish a run to take the first spot.</p>
      ) : (
        <table>
          <thead>
            <tr><th>#</th><th>Player</th><th>Best score</th><th>Best streak</th><th>Runs</th><th>Accuracy</th></tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u._id} className={u._id === user.id ? 'me' : ''}>
                <td>{i + 1}</td>
                <td className="player-cell"><Avatar seed={u.avatarSeed} size={30} /> {u.username}</td>
                <td><strong>{u.bestScore}</strong></td>
                <td>{u.bestStreak}</td>
                <td>{u.gamesPlayed}</td>
                <td>{accuracy(u)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
