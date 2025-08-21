import { useState, useEffect } from 'react';
import { Send, Bell, FileText, Smartphone, AlertCircle } from 'lucide-react';
import { useToast } from '../components/ui/toast';
import { notificationsAPI, applicationsAPI } from '../lib/api.jsx';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';

export function SendNotificationPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedApp, setSelectedApp] = useState('');
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
        // Set first app as default if available
        if (response.data.data.applications.length > 0) {
          setSelectedApp(response.data.data.applications[0].id.toString());
        }
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal memuat daftar aplikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedApp) {
      toast.error('Error', 'Pilih aplikasi terlebih dahulu');
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
      const response = await notificationsAPI.send({
        application_id: parseInt(selectedApp),
        title: title.trim(),
        message: message.trim(),
        file_url: fileUrl.trim() || null,
      });

      if (response.data.success) {
        toast.success('Berhasil', response.data.message);
        // Reset form
        setTitle('');
        setMessage('');
        setFileUrl('');
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
    if (!selectedApp) {
      toast.error('Error', 'Pilih aplikasi terlebih dahulu');
      return;
    }

    try {
      const response = await notificationsAPI.sendTest(parseInt(selectedApp));
      if (response.data.success) {
        const selectedAppName = applications.find(app => app.id.toString() === selectedApp)?.name;
        toast.success('Berhasil', `Notifikasi test berhasil dikirim ke ${selectedAppName}`);
      } else {
        toast.error('Error', response.data.message);
      }
    } catch (error) {
      toast.error('Error', error.response?.data?.message || 'Gagal mengirim notifikasi test');
    }
  };

  const selectedApplication = applications.find(app => app.id.toString() === selectedApp);
  const connectedClients = selectedApplication ? connectionStats[selectedApplication.app_token] || 0 : 0;

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
                  Isi form di bawah untuk mengirim notifikasi ke aplikasi yang dipilih.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="app-select">Pilih Aplikasi</Label>
                    <Select value={selectedApp} onValueChange={setSelectedApp}>
                      <SelectTrigger id="app-select">
                        <SelectValue placeholder="Pilih aplikasi" />
                      </SelectTrigger>
                      <SelectContent>
                        {applications.map(app => (
                          <SelectItem key={app.id} value={app.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{app.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {connectionStats[app.app_token] || 0} client
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          Kirim Notifikasi
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSendTest}
                      disabled={!selectedApp}
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
            {/* Selected App Info */}
            {selectedApplication && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Info Aplikasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Nama Aplikasi</Label>
                    <p className="text-sm text-muted-foreground">{selectedApplication.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Deskripsi</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedApplication.description || 'Tidak ada deskripsi'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status Koneksi</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={connectedClients > 0 ? 'default' : 'secondary'}>
                        {connectedClients} client terhubung
                      </Badge>
                    </div>
                  </div>
                  {connectedClients === 0 && (
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
                    Pastikan client aplikasi sudah terhubung sebelum mengirim notifikasi
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
