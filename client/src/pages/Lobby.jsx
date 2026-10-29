import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import Avatar from '../components/Avatar.jsx';

export default function Lobby() {
  const { socket, rooms } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    api.matches().then((d) => setMatches(d.matches)).catch(() => {});
  }, []);

  const createRoom = (e) => {
    e.preventDefault();
    setError('');
    socket.emit('room:create', { name: name.trim() }, (res) => {
      if (res.error) return setError(res.error);
      navigate(`/room/${res.roomId}`);
    });
  };

  const joinRoom = (roomId) => {
    setError('');
    socket.emit('room:join', { roomId }, (res) => {
      if (res.error) return setError(res.error);
      navigate(`/room/${res.roomId}`);
    });
  };

  return (
    <div className="grid-2">
      <section>
        <div className="card">
          <h2>Start a game</h2>
          <form onSubmit={createRoom} className="inline-form">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${user.username}'s room`} maxLength={30} />
            <button className="btn btn-primary" disabled={!socket}>Create room</button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>

        <div className="card">
          <h2>Open rooms <span className="count">{rooms.length}</span></h2>
          {rooms.length === 0 ? (
            <p className="muted empty">No open rooms right now. Create one and wait for a challenger!</p>
          ) : (
            <ul className="room-list">
              {rooms.map((r) => (
                <li key={r.id}>
                  <Avatar seed={r.hostAvatar} size={40} />
                  <div className="grow">
                    <strong>{r.name}</strong>
                    <small>Hosted by {r.host}</small>
                  </div>
                  <button className="btn btn-accent btn-sm" onClick={() => joinRoom(r.id)}>Join</button>
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
            <div><strong>{user.rating}</strong><small>Rating</small></div>
            <div><strong>{user.wins}</strong><small>Wins</small></div>
            <div><strong>{user.losses}</strong><small>Losses</small></div>
            <div><strong>{user.draws}</strong><small>Draws</small></div>
          </div>
        </div>
        <div className="card">
          <h2>Recent matches</h2>
          {matches.length === 0 ? (
            <p className="muted">No matches yet.</p>
          ) : (
            <ul className="match-list">
              {matches.map((m) => {
                const me = m.players.find((p) => p.user === user.id);
                const opp = m.players.find((p) => p.user !== user.id);
                const outcome = m.result === 'draw' ? 'Draw' : m.winner === user.id ? 'Win' : 'Loss';
                return (
                  <li key={m._id}>
                    <span className={`badge ${outcome.toLowerCase()}`}>{outcome}</span>
                    <span className="grow">vs {opp?.username}</span>
                    <small>{me?.ratingChange > 0 ? '+' : ''}{me?.ratingChange}</small>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
