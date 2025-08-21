import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoadingSpinner } from '../components/ui/loading-spinner';

export function SettingsPage() {
  const { user, changePassword } = useAuth();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      toast.error('Error', 'Konfirmasi password tidak cocok.');
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Error', 'Password baru minimal 6 karakter.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        toast.success('Berhasil', result.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast.error('Error', result.message);
      }
    } catch (error) {
      toast.error('Error', 'Terjadi kesalahan saat mengubah password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profil Pengguna</CardTitle>
          <CardDescription>Informasi dasar akun Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>NPK</Label>
            <Input value={user?.npk} disabled className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
          <CardDescription>Perbarui password akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Password Lama</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="confirm-new-password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><LoadingSpinner size="sm" className="mr-2" /> Mengubah...</>
              ) : (
                'Ubah Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

