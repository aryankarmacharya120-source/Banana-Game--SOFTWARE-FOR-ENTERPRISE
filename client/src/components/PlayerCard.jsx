import Avatar from './Avatar.jsx';

export default function PlayerCard({ player, isTurn, isMe, rematch }) {
  if (!player) {
    return (
      <div className="player-card empty">
        <div className="avatar placeholder">?</div>
        <div>
          <strong>Waiting for opponent</strong>
          <small>Share the invite link</small>
        </div>
      </div>
    );
  }
  return (
    <div className={`player-card ${isTurn ? 'turn' : ''}`}>
      <Avatar seed={player.avatarSeed} size={48} ring={player.color} />
      <div>
        <strong>
          {player.username} {isMe && <span className="tag">you</span>}
        </strong>
        <small>
          <span className={`mini-disc ${player.color}`} /> {player.color}
          {!player.connected && ' · disconnected'}
          {rematch && ' · wants rematch'}
        </small>
      </div>
      {isTurn && <span className="turn-pill">Turn</span>}
    </div>
  );
}
