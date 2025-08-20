import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../hooks/useAuth';
import socketService from '../../lib/socket.jsx';

export function Layout() {
  const { user } = useAuth();

  useEffect(() => {
    // Connect to WebSocket when layout mounts
    if (user) {
      socketService.connect();
      socketService.connectDashboard(user.id);
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [user]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

