import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, RefreshCcw, Smartphone, Bell, CheckSquare, Square, Trash2 as BulkTrash, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/toast';
import { applicationsAPI, notificationsAPI } from '../lib/api.jsx';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Badge } from '../components/ui/badge';
import { MultiSelect } from '../components/ui/multi-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../components/ui/alert-dialog';
import socketService from '../lib/socket.jsx';

export function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appPlatform, setAppPlatform] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);
  const [connectionStats, setConnectionStats] = useState({});
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState(new Set());
  
  // Bulk operations state
  const [selectedApps, setSelectedApps] = useState(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
    setupSocketListeners();
    
    // Connect to socket service if not already connected
    if (!socketService.getConnectionStatus()) {
      socketService.connect();
    }
    
    // Connect dashboard to receive real-time updates
    if (user?.username) {
      socketService.connectDashboard(user.username);
    }

    // Cleanup function
    return () => {
      // Remove socket listeners to prevent memory leaks
      socketService.off('connection_stats');
    };
  }, [user?.username]);

  const setupSocketListeners = () => {
    // Listen for real-time connection stats updates from backend
    socketService.on('connection_stats', (data) => {
      setConnectionStats(data.apps || {});
    });

    // Load initial connection stats from localStorage
    const initialStats = socketService.getConnectionStats();
    if (Object.keys(initialStats).length > 0) {
      setConnectionStats(initialStats);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await applicationsAPI.getAll();
      if (response.data.success) {
        setApplications(response.data.data.applications);
        // Reset selections when applications change
        setSelectedApps(new Set());
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal memuat daftar aplikasi');
    } finally {
      setLoading(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedApps.size === filteredApplications.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(filteredApplications.map(app => app.id)));
    }
  };

  const handleSelectApp = (appId) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApps(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedApps.size === 0) {
      toast.error('Error', 'Pilih aplikasi yang akan dihapus');
      return;
    }

    setIsBulkDeleting(true);
    try {
      const response = await applicationsAPI.bulkDelete(Array.from(selectedApps));
      if (response.data.success) {
        toast.success('Berhasil', response.data.message);
        setSelectedApps(new Set());
        loadApplications();
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal menghapus aplikasi');
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteOpen(false);
    }
  };

  const handleCreateNew = () => {
    setCurrentApp(null);
    setAppName('');
    setAppDescription('');
    setAppPlatform('');
    setIsModalOpen(true);
  };

  const handleEdit = (app) => {
    setCurrentApp(app);
    setAppName(app.name);
    setAppDescription(app.description || '');
    setAppPlatform(app.platform || '');
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

    if (!appPlatform) {
      toast.error('Error', 'Platform harus dipilih');
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      if (currentApp) {
        response = await applicationsAPI.update(currentApp.id, {
          name: appName.trim(),
          description: appDescription.trim(),
          platform: appPlatform,
        });
      } else {
        response = await applicationsAPI.create({
          name: appName.trim(),
          description: appDescription.trim(),
          platform: appPlatform,
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

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         (app.description && app.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    const matchesPlatform = platformFilter.size === 0 || platformFilter.has(app.platform);
    return matchesSearch && matchesPlatform;
  });

  const hasSelectedApps = selectedApps.size > 0;
  const isAllSelected = selectedApps.size === filteredApplications.length && filteredApplications.length > 0;

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

      {/* Filter Section */}
      {applications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                  Cari Aplikasi
                </Label>
                                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Cari berdasarkan nama atau deskripsi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                    {searchTerm !== debouncedSearchTerm && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                  </div>
              </div>
              
              {/* Platform Filter */}
              <div className="sm:w-48">
                <Label htmlFor="platformFilter" className="text-sm font-medium mb-2 block">
                  Filter Platform
                </Label>
                <MultiSelect
                  options={[
                    { id: 'mobile', name: '📱 Mobile' }, 
                    { id: 'website', name: '🌐 Website' }
                  ]}
                  selectedValues={platformFilter}
                  onSelectionChange={setPlatformFilter}
                  placeholder="Pilih platform..."
                  className="w-full"
                  getOptionValue={(option) => option.id}
                  getOptionLabel={(option) => option.name}
                />
              </div>
            </div>
            
            {/* Filter Summary */}
            {(searchTerm || platformFilter.size > 0) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Menampilkan {filteredApplications.length} dari {applications.length} aplikasi
                  {debouncedSearchTerm && ` untuk pencarian "${debouncedSearchTerm}"`}
                  {platformFilter.size > 0 && ` pada platform ${Array.from(platformFilter).map(p => p === 'mobile' ? 'Mobile' : 'Website').join(', ')}`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setPlatformFilter(new Set());
                    setSelectedApps(new Set());
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Reset Filter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
      ) : filteredApplications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              Tidak ada aplikasi yang sesuai dengan filter.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setPlatformFilter(new Set());
                setSelectedApps(new Set());
              }}
            >
              Reset Filter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Select All Checkbox - Only show when there are selections */}
          {hasSelectedApps && (
            <div className="col-span-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-6 w-6 p-0"
              >
                {isAllSelected ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm font-medium">
                {isAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </span>
              <span className="text-sm text-muted-foreground">
                ({selectedApps.size} dari {applications.length} dipilih)
              </span>
            </div>
          )}

          {filteredApplications.map((app) => (
            <Card key={app.id} className={selectedApps.has(app.id) ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectApp(app.id)}
                    className="h-5 w-5 p-0"
                  >
                    {selectedApps.has(app.id) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                  <CardTitle className="text-lg font-semibold">{app.name}</CardTitle>
                </div>
                <Badge variant={connectionStats[app.app_token] > 0 ? 'default' : 'secondary'}>
                  {connectionStats[app.app_token] || 0} client
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{app.description || 'Tidak ada deskripsi'}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {app.platform === 'mobile' ? '📱 Mobile' : '🌐 Website'}
                  </Badge>
                </div>
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

      {/* Floating Bulk Delete Button */}
      {hasSelectedApps && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            variant="destructive"
            onClick={() => setIsBulkDeleteOpen(true)}
            disabled={isBulkDeleting}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            {isBulkDeleting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Menghapus...
              </>
            ) : (
              <>
                <BulkTrash className="mr-2 h-5 w-5" />
                Hapus {selectedApps.size}
              </>
            )}
          </Button>
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
            <div className="grid gap-2">
              <Label htmlFor="appPlatform">Platform *</Label>
              <select
                id="appPlatform"
                value={appPlatform}
                onChange={(e) => setAppPlatform(e.target.value)}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Pilih platform aplikasi</option>
                <option value="mobile">📱 Mobile</option>
                <option value="website">🌐 Website</option>
              </select>
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

      {/* Confirm Bulk Delete Dialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Multiple Aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat diurungkan. Ini akan menghapus 
              <span className="font-semibold">{selectedApps.size} aplikasi</span> 
              secara permanen dan semua riwayat notifikasi yang terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isBulkDeleting ? (
                <><LoadingSpinner size="sm" className="mr-2" /> Menghapus...</>
              ) : (
                `Hapus ${selectedApps.size} Aplikasi`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

