import { useState, useEffect } from 'react';
import { History, Bell, Repeat, Trash2, Search } from 'lucide-react';
import { useToast } from '../components/ui/toast';
import { notificationsAPI, applicationsAPI } from '../lib/api.jsx';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../components/ui/alert-dialog';

export function HistoryPage() {
  const [notifications, setNotifications] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedApp]); // Reload when selectedApp changes

  const loadData = async () => {
    setLoading(true);
    try {
      // Load applications for filter
      const appsResponse = await applicationsAPI.getAll();
      if (appsResponse.data.success) {
        setApplications(appsResponse.data.data.applications);
      }

      // Load notifications
      const params = {};
      if (selectedApp !== 'all') {
        params.application_id = selectedApp;
      }
      const historyResponse = await notificationsAPI.getHistory(params);
      if (historyResponse.data.success) {
        setNotifications(historyResponse.data.data.notifications);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal memuat riwayat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleResendNotification = async (notification) => {
    if (!confirm('Apakah Anda yakin ingin mengirim ulang notifikasi ini?')) {
      return;
    }
    try {
      const response = await notificationsAPI.resend(notification.id);
      if (response.data.success) {
        toast.success('Berhasil', 'Notifikasi berhasil dikirim ulang!');
        loadData(); // Reload history to show the resent notification
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal mengirim ulang notifikasi');
    }
  };

  const handleDeleteClick = (notification) => {
    setNotificationToDelete(notification);
    setIsConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await notificationsAPI.delete(notificationToDelete.id);
      if (response.data.success) {
        toast.success('Berhasil', response.data.message);
        loadData(); // Reload history after delete
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal menghapus notifikasi');
    } finally {
      setNotificationToDelete(null);
      setIsConfirmDeleteOpen(false);
      setIsSubmitting(false);
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.application_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Riwayat Notifikasi</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Riwayat</CardTitle>
          <CardDescription>Saring notifikasi berdasarkan aplikasi atau kata kunci.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="app-filter">Filter Aplikasi</Label>
            <Select value={selectedApp} onValueChange={setSelectedApp}>
              <SelectTrigger id="app-filter">
                <SelectValue placeholder="Pilih Aplikasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aplikasi</SelectItem>
                {applications.map(app => (
                  <SelectItem key={app.id} value={app.id.toString()}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="search-term">Cari Notifikasi</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-term"
                placeholder="Cari judul, pesan, atau nama aplikasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredNotifications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              Tidak ada notifikasi yang ditemukan.
            </p>
            <p className="text-sm text-muted-foreground">
              Coba ubah filter atau kirim notifikasi baru.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNotifications.map(notification => (
            <Card key={notification.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notification.title}</p>
                    <p className="text-muted-foreground text-xs mt-1">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Smartphone className="h-3 w-3" />
                      <span>{notification.application_name}</span>
                      <History className="h-3 w-3 ml-2" />
                      <span>{new Date(notification.sent_at).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Badge variant={notification.status === 'SENT' ? 'default' : 'secondary'}>
                      {notification.status}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleResendNotification(notification)}
                      >
                        <Repeat className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(notification)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat diurungkan. Ini akan menghapus notifikasi 
              <span className="font-semibold">"{notificationToDelete?.title}"</span> 
              secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? (
                <><LoadingSpinner size="sm" className="mr-2" /> Menghapus...</>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

