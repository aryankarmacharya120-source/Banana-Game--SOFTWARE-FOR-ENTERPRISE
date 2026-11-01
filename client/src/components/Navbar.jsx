import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        <span className="brand-mark" />
        Banana Arena
      </NavLink>
      <nav className="nav-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/play">Play</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
      </nav>
      <div className="nav-user">
        <Avatar seed={user.avatarSeed} size={34} />
        <div className="nav-user-info">
          <strong>{user.username}</strong>
          <small>Best {user.bestScore}</small>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}
