import * as React from 'react';
import { NavLink as RouterNavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  BarChart3,
  Building2,
  Trophy,
  Settings,
  LogOut,
  Handshake,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import MobileMenuDrawer from '@/components/MobileMenuDrawer';
import NotificationInbox from '@/components/notifications/NotificationInbox';
import { usePermission } from '@/hooks/usePermission';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

const navItems = [
  { title: 'Agenda', url: '/agenda', icon: CalendarDays, permKey: 'agenda.view' },
  { title: 'Campanhas', url: '/campanhas', icon: Trophy, permKey: 'campaigns.view' },
  { title: 'Análises', url: '/analises', icon: BarChart3, permKey: 'analysis.reports' },
  { title: 'Parceiros', url: '/parceiros', icon: Building2, permKey: 'partners.list' },
  { title: 'Cadastro', url: '/cadastro', icon: ClipboardList, permKey: 'registration.view' },
  { title: 'Configurações', url: '/configuracoes', icon: Settings, permKey: 'settings.view' },
];

const AppSidebarContent = React.forwardRef<HTMLDivElement>(function AppSidebarContent(_props, _ref) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { canRead } = usePermission();
  const { getAvatar } = useUserAvatars();

  const visibleItems = navItems.filter(item => canRead(item.permKey));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className={cn("flex items-center gap-3 border-b border-border transition-all duration-200", collapsed ? "p-2 justify-center" : "p-4")}>
        <div className={cn("flex items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0 transition-all duration-200", collapsed ? "w-8 h-8" : "w-9 h-9")}>
          <Handshake className={cn("shrink-0", collapsed ? "h-4 w-4" : "h-5 w-5")} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-foreground truncate">Canal Parceiro</p>
          </div>
        )}
      </div>
      <SidebarContent className={cn("py-4 transition-all duration-200", collapsed ? "px-1" : "px-2")}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <RouterNavLink
                        to={item.url}
                        className={cn(
                          'flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
                          collapsed ? 'px-2 justify-center' : 'px-3',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </RouterNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* Footer */}
      <div className={cn("mt-auto border-t border-border transition-all duration-200", collapsed ? "p-2" : "p-4")}>
        <div className={cn("flex items-center transition-all duration-200", collapsed ? "justify-center" : "gap-3")}>
          <Avatar className="h-8 w-8">
            {user && getAvatar(user.id) && <AvatarImage src={getAvatar(user.id)} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={logout}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Sidebar>
  );
});
AppSidebarContent.displayName = 'AppSidebarContent';

function MobileNav() {
  const location = useLocation();
  const { canRead } = usePermission();
  const visibleItems = navItems.filter(item => canRead(item.permKey)).slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 pb-safe">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <RouterNavLink
              key={item.title}
              to={item.url}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground active:scale-95'
              )}
            >
              <item.icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110')} />
              <span className="text-[10px] font-medium">{item.title}</span>
              {isActive && <div className="h-0.5 w-4 rounded-full bg-primary" />}
            </RouterNavLink>
          );
        })}
      </div>
    </nav>
  );
}

const AppLayout = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(function AppLayout({ children }, ref) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const location = useLocation();
  const navigate = useNavigate();
  const { canRead } = usePermission();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const visibleRoutes = React.useMemo(
    () => navItems.filter(item => canRead(item.permKey)).map(item => item.url),
    [canRead]
  );

  const headerSwipe = useSwipeGesture({
    onSwipe: (dir) => {
      if (dir === 'down') setDrawerOpen(true);
    },
  });

  const pageSwipe = useSwipeGesture({
    onSwipe: (dir) => {
      const idx = visibleRoutes.indexOf(location.pathname);
      if (idx === -1) return;
      if (dir === 'left' && idx < visibleRoutes.length - 1) navigate(visibleRoutes[idx + 1]);
      if (dir === 'right' && idx > 0) navigate(visibleRoutes[idx - 1]);
    },
  });

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20" ref={ref}>
        <header
          className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-4 h-14 flex items-center gap-3"
          {...headerSwipe}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground active:scale-95 transition-transform"
          >
            <Handshake className="h-4 w-4" />
          </button>
          <span className="font-bold text-sm flex-1">Canal Parceiro</span>
          <ThemeToggleButton />
          <NotificationInbox />
        </header>
        <main className="px-6 py-6 pb-24" {...pageSwipe}>{children}</main>
        <MobileNav />
        <MobileMenuDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isTablet}>
      <div className="min-h-screen flex w-full">
        <AppSidebarContent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card/50 backdrop-blur-sm">
            <SidebarTrigger className="mr-4" />
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggleButton />
              <NotificationInbox />
            </div>
          </header>
          <main className="flex-1 p-8 overflow-auto scrollbar-thin">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
});
AppLayout.displayName = 'AppLayout';

export default AppLayout;
