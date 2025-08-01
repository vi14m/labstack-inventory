import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardData {
  lowStockComponents: any[];
  oldStockComponents: any[];
  monthlyInward: any[];
  monthlyOutward: any[];
  totalComponents: number;
  totalValue: number;
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData>({
    lowStockComponents: [],
    oldStockComponents: [],
    monthlyInward: [],
    monthlyOutward: [],
    totalComponents: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get all components for calculations
      const { data: allComponentsData } = await supabase
        .from('components')
        .select('*');
      
      const lowStock = allComponentsData?.filter(comp => comp.current_quantity < comp.low_stock_threshold) || [];

      // Get old stock components (no outward movement in 3+ months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: oldStock } = await supabase
        .from('components')
        .select('*')
        .or(`last_outward_date.is.null,last_outward_date.lt.${threeMonthsAgo.toISOString()}`);

      // Get monthly inward transactions
      const { data: inwardTrans } = await supabase
        .from('transactions')
        .select('quantity, transaction_date')
        .eq('transaction_type', 'inward')
        .gte('transaction_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      // Get monthly outward transactions
      const { data: outwardTrans } = await supabase
        .from('transactions')
        .select('quantity, transaction_date')
        .eq('transaction_type', 'outward')
        .gte('transaction_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate totals from the same data
      const totalComponents = allComponentsData?.reduce((sum, comp) => sum + comp.current_quantity, 0) || 0;
      const totalValue = allComponentsData?.reduce((sum, comp) => sum + (comp.current_quantity * comp.unit_price), 0) || 0;

      // Process monthly data
      const monthlyInward = processMonthlyData(inwardTrans || []);
      const monthlyOutward = processMonthlyData(outwardTrans || []);

      setData({
        lowStockComponents: lowStock || [],
        oldStockComponents: oldStock || [],
        monthlyInward,
        monthlyOutward,
        totalComponents,
        totalValue
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (transactions: any[]) => {
    const monthlyData: { [key: string]: number } = {};
    
    transactions.forEach(trans => {
      const date = new Date(trans.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + trans.quantity;
    });

    return Object.entries(monthlyData)
      .map(([month, quantity]) => ({ month, quantity }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight gradient-text">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening in your lab.</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Components</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{data.totalComponents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Active inventory</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">₹{data.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total inventory value</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{data.lowStockComponents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Old Stock Items</CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <TrendingDown className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{data.oldStockComponents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Slow moving items</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Inward Transactions</CardTitle>
            <CardDescription>Components received over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyInward}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Outward Transactions</CardTitle>
            <CardDescription>Components consumed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyOutward}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alert Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Threshold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lowStockComponents.slice(0, 5).map((component) => (
                  <TableRow key={component.id}>
                    <TableCell className="font-medium">{component.component_name}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{component.current_quantity}</Badge>
                    </TableCell>
                    <TableCell>{component.low_stock_threshold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Old Stock Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Last Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.oldStockComponents.slice(0, 5).map((component) => (
                  <TableRow key={component.id}>
                    <TableCell className="font-medium">{component.component_name}</TableCell>
                    <TableCell>{component.current_quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-orange-500">
                        {component.last_outward_date ? 
                          new Date(component.last_outward_date).toLocaleDateString() : 
                          'Never'
                        }
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;