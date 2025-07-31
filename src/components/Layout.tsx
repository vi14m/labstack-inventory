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
      <header className="border-b bg-card shadow-sm">
        <div className="flex h-16 items-center px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">ELIMS</h1>
            <span className="text-sm text-muted-foreground">
              Electronics Lab Inventory Management System
            </span>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {userProfile?.full_name} {isAdmin && '(Admin)'}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 border-r bg-card min-h-[calc(100vh-4rem)]">
          <div className="space-y-2 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant={window.location.pathname === item.href ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate(item.href)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Button>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;