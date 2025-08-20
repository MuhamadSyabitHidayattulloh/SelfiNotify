import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, RefreshCcw, Smartphone, Bell } from 'lucide-react';
import { useToast } from '../components/ui/toast';
import { applicationsAPI, notificationsAPI } from '../lib/api.jsx';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../components/ui/alert-dialog';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Badge } from '../components/ui/badge';
import socketService from '../lib/socket.jsx';

export function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);
  const [connectionStats, setConnectionStats] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
    setupSocketListeners();
  }, []);

  const setupSocketListeners = () => {
    socketService.on('connection_stats', (data) => {
      setConnectionStats(data.apps || {});
    });
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await applicationsAPI.getAll();
      if (response.data.success) {
        setApplications(response.data.data.applications);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal memuat daftar aplikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setCurrentApp(null);
    setAppName('');
    setAppDescription('');
    setIsModalOpen(true);
  };

  const handleEdit = (app) => {
    setCurrentApp(app);
    setAppName(app.name);
    setAppDescription(app.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!appName.trim()) {
      toast.error('Error', 'Nama aplikasi tidak boleh kosong');
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      if (currentApp) {
        response = await applicationsAPI.update(currentApp.id, {
          name: appName.trim(),
          description: appDescription.trim(),
        });
      } else {
        response = await applicationsAPI.create({
          name: appName.trim(),
          description: appDescription.trim(),
        });
      }

      if (response.data.success) {
        toast.success('Berhasil', response.data.message);
        setIsModalOpen(false);
        loadApplications(); // Reload applications after create/update
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (app) => {
    setAppToDelete(app);
    setIsConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!appToDelete) return;

    try {
      const response = await applicationsAPI.delete(appToDelete.id);
      if (response.data.success) {
        toast.success('Berhasil', response.data.message);
        loadApplications(); // Reload applications after delete
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal menghapus aplikasi');
    } finally {
      setAppToDelete(null);
      setIsConfirmDeleteOpen(false);
    }
  };

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    toast.info('Disalin', 'Token aplikasi berhasil disalin ke clipboard!');
  };

  const handleRegenerateToken = async (appId) => {
    if (!confirm('Apakah Anda yakin ingin meregenerasi token aplikasi ini? Token lama akan tidak valid.')) {
      return;
    }
    try {
      const response = await applicationsAPI.regenerateToken(appId);
      if (response.data.success) {
        toast.success('Berhasil', response.data.message);
        loadApplications(); // Reload to show new token
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal meregenerasi token');
    }
  };

  const handleSendTestNotification = async (appId, appName) => {
    try {
      const response = await notificationsAPI.sendTest(appId);
      if (response.data.success) {
        toast.success('Berhasil', `Notifikasi test berhasil dikirim ke ${appName}`);
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal mengirim notifikasi test');
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Aplikasi Saya</h1>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" /> Buat Aplikasi Baru
        </Button>
      </div>

      {applications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Smartphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              Belum ada aplikasi yang dibuat.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> Buat Aplikasi Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">{app.name}</CardTitle>
                <Badge variant={connectionStats[app.app_token] > 0 ? 'default' : 'secondary'}>
                  {connectionStats[app.app_token] || 0} client
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{app.description || 'Tidak ada deskripsi'}</p>
                <div className="relative flex items-center space-x-2 rounded-md bg-muted p-2 text-sm font-mono">
                  <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {app.app_token}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => handleCopyToken(app.app_token)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(app)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRegenerateToken(app.id)}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Regenerate Token
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSendTestNotification(app.id, app.name)}>
                    <Bell className="mr-2 h-4 w-4" /> Test Notifikasi
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(app)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Application Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentApp ? 'Edit Aplikasi' : 'Buat Aplikasi Baru'}</DialogTitle>
            <CardDescription>
              {currentApp ? 'Ubah detail aplikasi Anda.' : 'Buat aplikasi baru untuk mengirim notifikasi.'}
            </CardDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="appName">Nama Aplikasi</Label>
              <Input
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Contoh: Aplikasi Kasir Toko A"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="appDescription">Deskripsi (Opsional)</Label>
              <Textarea
                id="appDescription"
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                placeholder="Deskripsi singkat tentang aplikasi ini"
                disabled={isSubmitting}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><LoadingSpinner size="sm" className="mr-2" /> Menyimpan...</>
                ) : (
                  currentApp ? 'Simpan Perubahan' : 'Buat Aplikasi'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat diurungkan. Ini akan menghapus aplikasi 
              <span className="font-semibold">{appToDelete?.name}</span> 
              secara permanen dan semua riwayat notifikasi yang terkait.
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

