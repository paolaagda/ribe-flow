import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Building2,
  Trophy,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

const allNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, permKey: 'dashboard.metrics' },
  { title: 'Agenda', url: '/agenda', icon: CalendarDays, permKey: 'agenda.view' },
  { title: 'Análises', url: '/analises', icon: BarChart3, permKey: 'analysis.reports' },
  { title: 'Campanhas', url: '/campanhas', icon: Trophy, permKey: 'campaigns.view' },
  { title: 'Parceiros', url: '/parceiros', icon: Building2, permKey: 'partners.list' },
  { title: 'Configurações', url: '/configuracoes', icon: Settings, permKey: 'settings.view' },
];

interface MobileMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileMenuDrawer = React.forwardRef<HTMLDivElement, MobileMenuDrawerProps>(
  function MobileMenuDrawer({ open, onOpenChange }, ref) {
    const { user, logout } = useAuth();
    const { canRead } = usePermission();
    const { getAvatar } = useUserAvatars();
    const location = useLocation();
    const navigate = useNavigate();

    const visibleItems = allNavItems.filter(item => canRead(item.permKey));

    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent ref={ref}>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base">Menu</DrawerTitle>
            <DrawerDescription className="sr-only">Navegação principal</DrawerDescription>
          </DrawerHeader>

          <nav className="px-4 pb-2 space-y-1">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <button
                  key={item.title}
                  onClick={() => {
                    navigate(item.url);
                    onOpenChange(false);
                  }}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.97]'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-border mx-4 my-2" />

          <div className="px-4 pb-6 flex items-center gap-3">
            <Avatar className="h-9 w-9">
              {user && getAvatar(user.id) && <AvatarImage src={getAvatar(user.id)} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => {
                logout();
                onOpenChange(false);
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
);
MobileMenuDrawer.displayName = 'MobileMenuDrawer';

export default MobileMenuDrawer;
