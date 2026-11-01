import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Home from './pages/Home.jsx';
import Play from './pages/Play.jsx';
import Leaderboard from './pages/Leaderboard.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <div className="app">
      {user && <Navbar />}
      <main className="container">
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/" element={<Protected><Home /></Protected>} />
          <Route path="/play" element={<Protected><Play /></Protected>} />
          <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
