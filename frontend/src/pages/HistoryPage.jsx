import { useState, useEffect, useCallback } from 'react';
import { History, Bell, Repeat, Trash2, Search, Smartphone, CheckSquare, Square, Trash2 as BulkTrash } from 'lucide-react';
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Bulk operations state
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
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
        // Reset selections when notifications change
        setSelectedNotifications(new Set());
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal memuat riwayat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(notification => notification.id)));
    }
  };

  const handleSelectNotification = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.size === 0) {
      toast.error('Error', 'Pilih notifikasi yang akan dihapus');
      return;
    }

    setIsBulkDeleting(true);
    try {
      const response = await notificationsAPI.bulkDelete(Array.from(selectedNotifications));
      if (response.data.success) {
        toast.success('Berhasil', response.data.message);
        setSelectedNotifications(new Set());
        loadData();
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal menghapus notifikasi');
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteOpen(false);
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

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    notification.application_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasSelectedNotifications = selectedNotifications.size > 0;
  const isAllSelected = selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Riwayat Notifikasi</h1>
      </div>

      {/* Filter Section */}
      {applications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Application Filter */}
              <div className="sm:w-48">
                <Label htmlFor="app-filter" className="text-sm font-medium mb-2 block">
                  Filter Aplikasi
                </Label>
                <Select value={selectedApp} onValueChange={setSelectedApp}>
                  <SelectTrigger id="app-filter">
                    <SelectValue placeholder="Semua Aplikasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Aplikasi</SelectItem>
                    {applications.map(app => (
                      <SelectItem key={app.id} value={app.id.toString()}>
                        {app.platform === 'mobile' ? '📱' : '🌐'} {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Search Input */}
              <div className="flex-1">
                <Label htmlFor="search-term" className="text-sm font-medium mb-2 block">
                  Cari Notifikasi
                </Label>
                                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-term"
                      placeholder="Cari judul, pesan, atau nama aplikasi..."
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
            </div>
            
            {/* Filter Summary */}
            {(searchTerm || selectedApp !== 'all') && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Menampilkan {filteredNotifications.length} dari {notifications.length} notifikasi
                  {debouncedSearchTerm && ` untuk pencarian "${debouncedSearchTerm}"`}
                  {selectedApp !== 'all' && ` pada aplikasi ${applications.find(app => app.id.toString() === selectedApp)?.name}`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedApp('all');
                    setSelectedNotifications(new Set());
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

      {filteredNotifications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            {debouncedSearchTerm || selectedApp !== 'all' ? (
              <>
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">
                  Tidak ada notifikasi yang sesuai dengan filter.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedApp('all');
                    setSelectedNotifications(new Set());
                  }}
                >
                  Reset Filter
                </Button>
              </>
            ) : (
              <>
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">
                  Tidak ada notifikasi yang ditemukan.
                </p>
                <p className="text-sm text-muted-foreground">
                  Coba ubah filter atau kirim notifikasi baru.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All Checkbox - Only show when there are selections */}
          {hasSelectedNotifications && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
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
                ({selectedNotifications.size} dari {filteredNotifications.length} dipilih)
              </span>
            </div>
          )}

          {filteredNotifications.map(notification => (
            <Card key={notification.id} className={selectedNotifications.has(notification.id) ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectNotification(notification.id)}
                      className="h-5 w-5 p-0 mt-1"
                    >
                      {selectedNotifications.has(notification.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-muted-foreground text-xs mt-1">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Smartphone className="h-3 w-3" />
                          <span>{notification.application_name}</span>
                          <History className="h-3 w-3 ml-2" />
                          <span>{new Date(notification.sent_at).toLocaleString('id-ID')}</span>
                        </div>
                        {/* Platform Badge */}
                        {applications.find(app => app.id.toString() === notification.application_id?.toString()) && (
                          <Badge variant="outline" className="text-xs">
                            {applications.find(app => app.id.toString() === notification.application_id?.toString())?.platform === 'mobile' ? '📱 Mobile' : '🌐 Website'}
                          </Badge>
                        )}
                      </div>
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

      {/* Floating Bulk Delete Button */}
      {hasSelectedNotifications && (
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
                Hapus {selectedNotifications.size}
              </>
            )}
          </Button>
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

      {/* Confirm Bulk Delete Dialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Multiple Notifikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat diurungkan. Ini akan menghapus 
              <span className="font-semibold">{selectedNotifications.size} notifikasi</span> 
              secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isBulkDeleting ? (
                <><LoadingSpinner size="sm" className="mr-2" /> Menghapus...</>
              ) : (
                `Hapus ${selectedNotifications.size} Notifikasi`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

