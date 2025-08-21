import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Smartphone, 
  History, 
  Settings, 
  Menu,
  X,
  Send
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const navigation = [
  {
    name: 'Dashboard',
    href: 'dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Aplikasi Saya',
    href: 'applications',
    icon: Smartphone,
  },
  {
    name: 'Kirim Notifikasi',
    href: 'send-notification',
    icon: Send,
  },
  {
    name: 'Riwayat Notifikasi',
    href: 'history',
    icon: History,
  },
  {
    name: 'Pengaturan',
    href: 'settings',
    icon: Settings,
  },
];

export function Sidebar({ className }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleMobile}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
          'md:relative md:translate-x-0',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className={cn(
            'flex items-center gap-3 transition-opacity duration-200',
            isCollapsed && 'opacity-0 md:opacity-100'
          )}>
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Send className="h-5 w-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg text-sidebar-foreground">SelfiNotify</h1>
                <p className="text-xs text-sidebar-foreground/60">Real-time Notifications</p>
              </div>
            )}
          </div>
          
          {/* Collapse button - only on desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-8 w-8"
            onClick={toggleCollapse}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive 
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                        : 'text-sidebar-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn(
            'text-xs text-sidebar-foreground/60 text-center transition-opacity duration-200',
            isCollapsed && 'opacity-0 md:opacity-100'
          )}>
            {!isCollapsed && (
              <>
                <p>SelfiNotify v1.0.0</p>
                <p className="mt-1">© 2024 MuhamadSyabitHidayattulloh</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

