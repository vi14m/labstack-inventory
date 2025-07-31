import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Package, ArrowUp, ArrowDown, Edit } from 'lucide-react';

interface Component {
  id: string;
  component_name: string;
  part_number: string;
  manufacturer_supplier: string;
  description: string;
  category: string;
  current_quantity: number;
  location_bin: string;
  unit_price: number;
  datasheet_link: string;
  low_stock_threshold: number;
  last_inward_date: string;
  last_outward_date: string;
}

const Components = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const categories = [
    'Resistors', 'Capacitors', 'Inductors', 'Diodes', 'Transistors',
    'Integrated Circuits', 'Microcontrollers', 'Sensors', 'Connectors',
    'Switches/Buttons', 'LEDs/Displays', 'Cables/Wires', 'Mechanical Parts', 'Misc Supplies'
  ];

  useEffect(() => {
    loadComponents();
  }, []);

  useEffect(() => {
    filterComponents();
  }, [components, searchTerm, selectedCategory]);

  const loadComponents = async () => {
    try {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .order('component_name');

      if (error) throw error;
      setComponents(data || []);
    } catch (error) {
      console.error('Error loading components:', error);
      toast({
        title: "Error",
        description: "Failed to load components",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterComponents = () => {
    let filtered = components;

    if (searchTerm) {
      filtered = filtered.filter(comp =>
        comp.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.location_bin.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(comp => comp.category === selectedCategory);
    }

    setFilteredComponents(filtered);
  };

  const handleAddComponent = async (formData: FormData) => {
    try {
      const newComponent = {
        component_name: formData.get('component_name') as string,
        part_number: formData.get('part_number') as string,
        manufacturer_supplier: formData.get('manufacturer_supplier') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        current_quantity: parseInt(formData.get('current_quantity') as string),
        location_bin: formData.get('location_bin') as string,
        unit_price: parseFloat(formData.get('unit_price') as string),
        datasheet_link: formData.get('datasheet_link') as string,
        low_stock_threshold: parseInt(formData.get('low_stock_threshold') as string),
        created_by: user?.id
      };

      const { error } = await supabase
        .from('components')
        .insert([newComponent]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Component added successfully"
      });

      setShowAddDialog(false);
      loadComponents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTransaction = async (formData: FormData) => {
    if (!selectedComponent) return;

    try {
      const transactionType = formData.get('transaction_type') as 'inward' | 'outward';
      const quantity = parseInt(formData.get('quantity') as string);
      const reason = formData.get('reason') as string;
      const notes = formData.get('notes') as string;

      // Check if outward transaction would result in negative stock
      if (transactionType === 'outward' && selectedComponent.current_quantity < quantity) {
        toast({
          title: "Error",
          description: "Insufficient stock for outward transaction",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .insert([{
          component_id: selectedComponent.id,
          transaction_type: transactionType,
          quantity,
          reason_project: reason,
          notes,
          performed_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${transactionType} transaction recorded successfully`
      });

      setShowTransactionDialog(false);
      setSelectedComponent(null);
      loadComponents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading components...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Components</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Component
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, part number, category, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components Table */}
      <Card>
        <CardHeader>
          <CardTitle>Components ({filteredComponents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComponents.map((component) => (
                <TableRow key={component.id}>
                  <TableCell className="font-medium">
                    {component.component_name}
                    {component.current_quantity < component.low_stock_threshold && (
                      <Badge variant="destructive" className="ml-2">Low Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell>{component.part_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{component.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={component.current_quantity < component.low_stock_threshold ? 'text-destructive font-bold' : ''}>
                      {component.current_quantity}
                    </span>
                  </TableCell>
                  <TableCell>{component.location_bin}</TableCell>
                  <TableCell>₹{component.unit_price}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedComponent(component);
                          setShowTransactionDialog(true);
                        }}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Transaction
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Component Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Component</DialogTitle>
            <DialogDescription>
              Enter the details for the new component.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddComponent(new FormData(e.currentTarget));
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="component_name">Component Name *</Label>
                <Input id="component_name" name="component_name" required />
              </div>
              <div>
                <Label htmlFor="part_number">Part Number *</Label>
                <Input id="part_number" name="part_number" required />
              </div>
              <div>
                <Label htmlFor="manufacturer_supplier">Manufacturer/Supplier</Label>
                <Input id="manufacturer_supplier" name="manufacturer_supplier" />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="current_quantity">Initial Quantity *</Label>
                <Input id="current_quantity" name="current_quantity" type="number" min="0" required />
              </div>
              <div>
                <Label htmlFor="location_bin">Location/Bin *</Label>
                <Input id="location_bin" name="location_bin" required />
              </div>
              <div>
                <Label htmlFor="unit_price">Unit Price (₹) *</Label>
                <Input id="unit_price" name="unit_price" type="number" step="0.01" min="0" required />
              </div>
              <div>
                <Label htmlFor="low_stock_threshold">Low Stock Threshold *</Label>
                <Input id="low_stock_threshold" name="low_stock_threshold" type="number" min="0" required />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
            <div>
              <Label htmlFor="datasheet_link">Datasheet Link</Label>
              <Input id="datasheet_link" name="datasheet_link" type="url" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Component</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
            <DialogDescription>
              Record an inward or outward transaction for {selectedComponent?.component_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleTransaction(new FormData(e.currentTarget));
          }} className="space-y-4">
            <div>
              <Label htmlFor="transaction_type">Transaction Type *</Label>
              <Select name="transaction_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inward">Inward (Add Stock)</SelectItem>
                  <SelectItem value="outward">Outward (Remove Stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input 
                id="quantity" 
                name="quantity" 
                type="number" 
                min="1" 
                max={selectedComponent?.current_quantity}
                required 
              />
              <p className="text-sm text-muted-foreground mt-1">
                Current stock: {selectedComponent?.current_quantity}
              </p>
            </div>
            <div>
              <Label htmlFor="reason">Reason/Project *</Label>
              <Input id="reason" name="reason" placeholder="e.g., Project XYZ, Maintenance, Testing" required />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Additional notes..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowTransactionDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Transaction</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Components;