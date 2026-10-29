import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import Avatar from './Avatar.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        <span className="brand-dot red" />
        <span className="brand-dot yellow" />
        Connect Arena
      </NavLink>
      <nav className="nav-links">
        <NavLink to="/" end>Lobby</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
      </nav>
      <div className="nav-user">
        <span className={`status-dot ${connected ? 'on' : 'off'}`} title={connected ? 'Connected' : 'Reconnecting...'} />
        <Avatar seed={user.avatarSeed} size={34} />
        <div className="nav-user-info">
          <strong>{user.username}</strong>
          <small>{user.rating} pts</small>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}
