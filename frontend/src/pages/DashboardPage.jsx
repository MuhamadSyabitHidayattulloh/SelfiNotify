import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Smartphone, 
  Bell, 
  Users, 
  TrendingUp,
  Activity,
  Send
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/toast';
import { applicationsAPI, notificationsAPI } from '../lib/api.jsx';
import socketService from '../lib/socket.jsx';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading-spinner';

export function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState({
    total_applications: 0,
    total_notifications: 0,
    today_notifications: 0,
    connected_clients: 0
  });
  const [applications, setApplications] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStats, setConnectionStats] = useState({});

  useEffect(() => {
    loadDashboardData();
    setupSocketListeners();
  }, []);

  const setupSocketListeners = () => {
    // Listen for real-time connection updates
    socketService.on('connection_stats', (data) => {
      setConnectionStats(data.apps || {});
      setStats(prev => ({
        ...prev,
        connected_clients: data.total_connections || 0
      }));
    });

    socketService.on('client_connected', (data) => {
      setStats(prev => ({
        ...prev,
        connected_clients: prev.connected_clients + 1
      }));
      toast.info('Client Terhubung', `Client baru terhubung ke aplikasi`);
    });

    socketService.on('client_disconnected', (data) => {
      setStats(prev => ({
        ...prev,
        connected_clients: Math.max(0, prev.connected_clients - 1)
      }));
    });

    socketService.on('notification_sent', (data) => {
      setStats(prev => ({
        ...prev,
        total_notifications: prev.total_notifications + 1,
        today_notifications: prev.today_notifications + 1
      }));
      toast.success('Notifikasi Terkirim', 'Notifikasi berhasil dikirim ke client');
    });
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load applications
      const appsResponse = await applicationsAPI.getAll();
      if (appsResponse.data.success) {
        setApplications(appsResponse.data.data.applications);
        setStats(prev => ({
          ...prev,
          total_applications: appsResponse.data.data.applications.length
        }));
      }

      // Load notification stats
      const statsResponse = await notificationsAPI.getStats();
      if (statsResponse.data.success) {
        const notifStats = statsResponse.data.data.stats;
        setStats(prev => ({
          ...prev,
          total_notifications: notifStats.total_notifications || 0,
          today_notifications: notifStats.today_notifications || 0
        }));
      }

      // Load recent notifications
      const historyResponse = await notificationsAPI.getHistory({ limit: 5 });
      if (historyResponse.data.success) {
        setRecentNotifications(historyResponse.data.data.notifications);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Error', 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Selamat datang, {user?.npk}!
        </h1>
        <p className="text-muted-foreground">
          Kelola notifikasi real-time untuk aplikasi Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aplikasi</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_applications}</div>
            <p className="text-xs text-muted-foreground">
              Aplikasi yang terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Terhubung</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.connected_clients}</div>
            <p className="text-xs text-muted-foreground">
              Koneksi aktif saat ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifikasi Hari Ini</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today_notifications}</div>
            <p className="text-xs text-muted-foreground">
              Dikirim hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifikasi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_notifications}</div>
            <p className="text-xs text-muted-foreground">
              Semua notifikasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
          <CardDescription>
            Tindakan yang sering digunakan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/applications" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Buat Aplikasi Baru
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/history" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Kirim Notifikasi
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Aplikasi Terbaru</CardTitle>
            <CardDescription>
              Daftar aplikasi yang telah dibuat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-6">
                <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Belum ada aplikasi yang dibuat
                </p>
                <Button asChild size="sm">
                  <Link to="/applications">
                    Buat Aplikasi Pertama
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{app.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {app.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={connectionStats[app.app_token] > 0 ? 'default' : 'secondary'}>
                        {connectionStats[app.app_token] || 0} client
                      </Badge>
                    </div>
                  </div>
                ))}
                {applications.length > 5 && (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/applications">
                      Lihat Semua ({applications.length})
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifikasi Terbaru</CardTitle>
            <CardDescription>
              Riwayat notifikasi yang baru dikirim
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <div className="text-center py-6">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Belum ada notifikasi yang dikirim
                </p>
                <Button asChild size="sm">
                  <Link to="/applications">
                    Kirim Notifikasi Pertama
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((notification) => (
                  <div key={notification.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{notification.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.application_name} • {new Date(notification.sent_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {notification.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/history">
                    Lihat Semua Riwayat
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

