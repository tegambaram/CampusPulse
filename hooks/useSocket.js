import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../utils/socketClient';

// Returns the single shared Socket.io connection once the user is authenticated (null
// otherwise). All screens calling this share the same underlying socket (connectSocket()
// is a module-level singleton), so events like 'receive_message' reach every subscriber.
export default function useSocket() {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setSocket(null);
      return undefined;
    }
    setSocket(connectSocket(token));
  }, [isAuthenticated, token]);

  return socket;
}
