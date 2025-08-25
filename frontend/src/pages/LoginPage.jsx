import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Bell, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';

export function LoginPage() {
  const [npk, setNpk] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!npk.trim() || !password.trim()) {
      toast.error('Error', 'NPK dan password harus diisi');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(npk.trim(), password);
      
      if (result.success) {
        toast.success('Berhasil', 'Login berhasil! Selamat datang.');
      } else {
        toast.error('Login Gagal', result.message);
      }
    } catch (error) {
      toast.error('Error', 'Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full mx-auto mb-4">
            <Bell className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">SelfiNotify</CardTitle>
          <CardDescription>
            Masuk ke dashboard notifikasi real-time
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="npk">NPK</Label>
              <Input
                id="npk"
                type="text"
                placeholder="Masukkan NPK Anda"
                value={npk}
                onChange={(e) => setNpk(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

