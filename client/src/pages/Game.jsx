import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Board from '../components/Board.jsx';
import Chat from '../components/Chat.jsx';
import PlayerCard from '../components/PlayerCard.jsx';

export default function Game() {
  const { id } = useParams();
  const { socket } = useSocket();
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [chat, setChat] = useState([]);
  const [over, setOver] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const onState = (g) => {
      setGame(g);
      setChat((prev) => (prev.length === 0 ? g.chat : prev));
      if (g.status !== 'finished') setOver(null);
    };
    const onOver = (res) => {
      setOver(res);
      refresh(); // pull updated rating
    };
    const onChat = (m) => setChat((prev) => [...prev, m]);

    socket.on('game:state', onState);
    socket.on('game:over', onOver);
    socket.on('chat:message', onChat);

    socket.emit('room:join', { roomId: id }, (res) => {
      if (res?.error) {
        setError(res.error);
        setTimeout(() => navigate('/'), 1800);
      }
    });

    return () => {
      socket.off('game:state', onState);
      socket.off('game:over', onOver);
      socket.off('chat:message', onChat);
    };
  }, [socket, id]);

  const leave = () => {
    socket.emit('room:leave');
    navigate('/');
  };

  const drop = (col) => socket.emit('game:move', { col }, (res) => res?.error && setError(res.error));

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (error && !game) {
    return (
      <div className="center-screen">
        <div className="card"><p className="error">{error}</p><p className="muted">Returning to lobby...</p></div>
      </div>
    );
  }
  if (!game) return <div className="center-screen"><div className="spinner" /></div>;

  const me = game.players.find((p) => p.userId === user.id);
  const opp = game.players.find((p) => p.userId !== user.id);
  const myTurn = game.status === 'playing' && game.turn === me?.color;
  const iRematched = game.rematch.includes(user.id);

  let banner;
  if (game.status === 'waiting') banner = { text: 'Waiting for an opponent to join…', cls: 'info' };
  else if (game.status === 'playing') banner = myTurn ? { text: 'Your turn — drop a disc!', cls: 'go' } : { text: `${opp?.username}'s turn…`, cls: 'info' };
  else if (!game.winner) banner = { text: "It's a draw!", cls: 'info' };
  else banner = game.winner === user.id
    ? { text: over?.result === 'forfeit' ? 'You win — opponent left!' : '🎉 You win!', cls: 'win' }
    : { text: 'You lost this one', cls: 'lose' };

  const change = over?.ratingChanges?.[user.id];

  return (
    <div className="game-layout">
      <section className="game-main">
        <div className="game-head">
          <div>
            <h2>{game.name}</h2>
            <small className="muted">Room {game.id}</small>
          </div>
          <div className="game-actions">
            {game.status === 'waiting' && (
              <button className="btn btn-ghost btn-sm" onClick={copyLink}>{copied ? 'Copied!' : 'Copy invite link'}</button>
            )}
            <button className="btn btn-danger btn-sm" onClick={leave}>{game.status === 'playing' ? 'Forfeit & leave' : 'Leave'}</button>
          </div>
        </div>

        <div className="players">
          <PlayerCard player={me} isMe isTurn={game.status === 'playing' && game.turn === me?.color} rematch={game.rematch.includes(me?.userId)} />
          <span className="vs">VS</span>
          <PlayerCard player={opp} isTurn={game.status === 'playing' && game.turn === opp?.color} rematch={game.rematch.includes(opp?.userId)} />
        </div>

        <div className={`banner ${banner.cls}`}>
          {banner.text}
          {game.status === 'finished' && change !== undefined && (
            <span className="rating-change">{change > 0 ? `+${change}` : change} rating</span>
          )}
        </div>

        <Board game={game} myColor={me?.color} onDrop={drop} />

        {error && <div className="error">{error}</div>}

        {game.status === 'finished' && game.players.length === 2 && (
          <div className="end-actions">
            <button className="btn btn-primary" disabled={iRematched} onClick={() => socket.emit('game:rematch')}>
              {iRematched ? 'Waiting for opponent…' : 'Rematch'}
            </button>
          </div>
        )}
      </section>

      <aside>
        <Chat messages={chat} onSend={(text) => socket.emit('chat:message', { text })} />
      </aside>
    </div>
  );
}
