import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext({ socket: null, connected: false, rooms: [] });
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (!user) return;
    const s = io({ withCredentials: true });
    setSocket(s);
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('lobby:rooms', setRooms);
    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user?.id]);

  return <SocketContext.Provider value={{ socket, connected, rooms }}>{children}</SocketContext.Provider>;
}
