import { useState, useEffect } from 'react';
import { Send, Bell, FileText, Smartphone, AlertCircle, Users } from 'lucide-react';
import { useToast } from '../components/ui/toast';
import { notificationsAPI, applicationsAPI } from '../lib/api.jsx';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { MultiSelect } from '../components/ui/multi-select';

export function SendNotificationPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedApps, setSelectedApps] = useState(new Set());
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [connectionStats, setConnectionStats] = useState({});
  
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedApps.size === 0) {
      toast.error('Error', 'Pilih minimal satu aplikasi');
      return;
    }

    if (!title.trim()) {
      toast.error('Error', 'Judul notifikasi tidak boleh kosong');
      return;
    }

    if (!message.trim()) {
      toast.error('Error', 'Pesan notifikasi tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (selectedApps.size === 1) {
        // Single notification
        const appId = Array.from(selectedApps)[0];
        response = await notificationsAPI.send({
          application_id: parseInt(appId),
          title: title.trim(),
          message: message.trim(),
          file_url: fileUrl.trim() || null,
        });
      } else {
        // Bulk notification
        response = await notificationsAPI.bulkSend({
          applications: Array.from(selectedApps),
          title: title.trim(),
          message: message.trim(),
          file_url: fileUrl.trim() || null,
        });
      }

      if (response.data.success) {
        toast.success('Berhasil', response.data.message);
        // Reset form
        setTitle('');
        setMessage('');
        setFileUrl('');
        setSelectedApps(new Set());
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Terjadi kesalahan saat mengirim notifikasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTest = async () => {
    if (selectedApps.size === 0) {
      toast.error('Error', 'Pilih minimal satu aplikasi');
      return;
    }

    if (selectedApps.size > 1) {
      toast.error('Error', 'Test notification hanya bisa dikirim ke satu aplikasi');
      return;
    }

    try {
      const appId = Array.from(selectedApps)[0];
      const response = await notificationsAPI.sendTest(parseInt(appId));
      if (response.data.success) {
        const selectedAppName = applications.find(app => app.id === appId)?.name;
        toast.success('Berhasil', `Notifikasi test berhasil dikirim ke ${selectedAppName}`);
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal mengirim notifikasi test');
    }
  };

  const totalConnectedClients = Array.from(selectedApps).reduce((total, appId) => {
    const app = applications.find(a => a.id === appId);
    return total + (connectionStats[app?.app_token] || 0);
  }, 0);

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kirim Notifikasi</h1>
          <p className="text-muted-foreground">Kirim notifikasi real-time ke aplikasi Anda</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Smartphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              Belum ada aplikasi yang dibuat.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Buat aplikasi terlebih dahulu untuk dapat mengirim notifikasi.
            </p>
            <Button onClick={() => window.location.href = '/applications'}>
              <Smartphone className="mr-2 h-4 w-4" /> Buat Aplikasi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Form Notifikasi
                </CardTitle>
                <CardDescription>
                  {selectedApps.size === 0 
                    ? 'Pilih aplikasi untuk mengirim notifikasi'
                    : selectedApps.size === 1
                    ? 'Kirim notifikasi ke aplikasi yang dipilih'
                    : `Kirim notifikasi ke ${selectedApps.size} aplikasi sekaligus`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Application Selection */}
                  <div className="grid gap-2">
                    <Label>Pilih Aplikasi</Label>
                    
                    <MultiSelect
                      options={applications}
                      selectedValues={selectedApps}
                      onSelectionChange={setSelectedApps}
                      placeholder="Pilih aplikasi untuk dikirim notifikasi..."
                      searchPlaceholder="Cari aplikasi..."
                      getOptionValue={(app) => app.id}
                      getOptionLabel={(app) => `${app.platform === 'mobile' ? '📱' : '🌐'} ${app.name}`}
                      getOptionDescription={(app) => app.description}
                      getOptionBadge={(app) => `${connectionStats[app.app_token] || 0} client`}
                      showSelectAll={true}
                      showClearAll={true}
                      className="w-full"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="title">Judul Notifikasi *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Pesanan Baru"
                      maxLength={255}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {title.length}/255 karakter
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="message">Pesan Notifikasi *</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tulis pesan notifikasi yang akan dikirim..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fileUrl">URL File (Opsional)</Label>
                    <Input
                      id="fileUrl"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://example.com/file.pdf"
                      type="url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Link ke file yang ingin dibagikan bersama notifikasi
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          {selectedApps.size === 1 ? 'Kirim Notifikasi' : `Kirim ke ${selectedApps.size} Aplikasi`}
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSendTest}
                      disabled={selectedApps.size !== 1}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Test
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            {/* Selected Apps Info */}
            {selectedApps.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Info Aplikasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Aplikasi Dipilih</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedApps.size} dari {applications.length} aplikasi
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Client</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={totalConnectedClients > 0 ? 'default' : 'secondary'}>
                        {totalConnectedClients} client terhubung
                      </Badge>
                    </div>
                  </div>
                  {totalConnectedClients === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Tidak ada client yang terhubung. Notifikasi tidak akan terkirim.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips Penggunaan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-muted-foreground">
                    Pilih satu aplikasi untuk notifikasi tunggal, atau multiple aplikasi untuk bulk send
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-muted-foreground">
                    Gunakan judul yang singkat dan jelas untuk notifikasi
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-muted-foreground">
                    Test notifikasi terlebih dahulu untuk memastikan koneksi berfungsi
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
