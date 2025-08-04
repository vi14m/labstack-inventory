import { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Package, BarChart3, Users, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, userProfile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Components', href: '/components', icon: Package },
    ...(isAdmin ? [
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Settings', href: '/settings', icon: Settings }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-effect border-b sticky top-0 z-50 animate-fade-in">
        <div className="container-padding">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center animate-float shadow-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold gradient-text">ELIMS</h1>
                <span className="text-xs text-subtle hidden sm:block">
                  Electronics Lab Inventory Management System
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 rounded-full surface-elevated">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span className="text-sm text-emphasis">
                  {userProfile?.full_name}
                </span>
                {isAdmin && (
                  <span className="status-info">Admin</span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <nav className="w-64 border-r surface-elevated animate-slide-up">
          <div className="content-spacing p-6">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = window.location.pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-start transition-all duration-200 ${
                      isActive 
                        ? "btn-primary-gradient text-primary-foreground shadow-md" 
                        : "hover:bg-accent/50 hover:translate-x-1"
                    }`}
                    onClick={() => navigate(item.href)}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="flex-1 bg-gradient-to-br from-background via-background to-muted/10">
          <div className="container-padding section-spacing">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;