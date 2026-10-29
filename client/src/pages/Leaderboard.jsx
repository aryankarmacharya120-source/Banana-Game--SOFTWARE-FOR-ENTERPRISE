import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

const medals = ['🥇', '🥈', '🥉'];

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
        <p className="muted empty">No ranked players yet. Finish a game to appear here!</p>
      ) : (
        <table>
          <thead>
            <tr><th>#</th><th>Player</th><th>Rating</th><th>W</th><th>L</th><th>D</th></tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u._id} className={u._id === user.id ? 'me' : ''}>
                <td>{medals[i] || i + 1}</td>
                <td className="player-cell"><Avatar seed={u.avatarSeed} size={32} /> {u.username}</td>
                <td><strong>{u.rating}</strong></td>
                <td>{u.wins}</td>
                <td>{u.losses}</td>
                <td>{u.draws}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
