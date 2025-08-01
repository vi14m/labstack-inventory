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
      <header className="glass-effect border-b shadow-lg sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center animate-float">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">ELIMS</h1>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Electronics Lab Inventory Management System
                </span>
              </div>
            </div>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-muted/50">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-sm font-medium">
                {userProfile?.full_name} {isAdmin && '(Admin)'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="shadow-sm hover:shadow-md transition-all">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 border-r glass-effect min-h-[calc(100vh-4rem)]">
          <div className="space-y-2 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.href;
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start transition-all duration-200 ${
                    isActive 
                      ? "btn-primary-gradient text-primary-foreground shadow-lg" 
                      : "hover:bg-accent/50 hover:translate-x-1"
                  }`}
                  onClick={() => navigate(item.href)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Button>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 p-6 bg-gradient-to-br from-background to-muted/20">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;