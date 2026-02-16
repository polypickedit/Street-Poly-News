import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList, Edit2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface MerchInventoryItem {
  id: string;
  name: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  stock: number;
  price_cents: number;
}

const InventoryPage = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<MerchInventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [editingStock, setEditingStock] = useState<{ id: string; value: number } | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('merch_inventory')
          .select('*')
          .order('stock', { ascending: true });

        if (error) throw error;
        setInventory((data as unknown as MerchInventoryItem[]) || []);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        toast({
          title: "Error",
          description: "Could not fetch inventory",
          variant: "destructive",
        });
      } finally {
        setIsLoadingInventory(false);
      }
    };

    fetchInventory();
  }, [toast]);

  const updateStock = async (itemId: string, newStock: number) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('merch_inventory')
        .update({ stock: newStock })
        .eq('id', itemId);

      if (error) throw error;

      setInventory(prev => prev.map(item => 
        item.id === itemId ? { ...item, stock: newStock } : item
      ));

      setEditingStock(null);
      toast({
        title: "Stock updated",
        description: `Inventory stock updated to ${newStock}`,
      });
    } catch (err) {
      console.error('Error updating stock:', err);
      toast({
        title: "Update failed",
        description: "Could not update inventory stock",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Inventory Management</h1>
        <ClipboardList className="w-8 h-8 text-dem" />
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-black text-xl text-foreground">Stock Control</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingInventory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-dem" />
            </div>
          ) : inventory && inventory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Item Name</th>
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Variant (Size/Color)</th>
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Stock Level</th>
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Price (USD)</th>
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">SKU</th>
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inventory.map((item: MerchInventoryItem) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 font-black text-foreground uppercase tracking-tight">{item.name}</td>
                      <td className="py-4">
                        <div className="flex gap-1">
                          {[item.size, item.color].filter(Boolean).map((v, i) => (
                            <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded font-bold border border-border/50 uppercase">
                              {v}
                            </span>
                          )) || <span className="text-muted-foreground italic text-xs">Default</span>}
                        </div>
                      </td>
                      <td className="py-4">
                        {editingStock?.id === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input 
                              title="Edit stock quantity"
                              type="number" 
                              className="w-20 h-8 bg-card border-dem/50 focus:ring-dem font-black"
                              value={editingStock.value}
                              onChange={(e) => setEditingStock({ id: item.id, value: parseInt(e.target.value) || 0 })}
                              onKeyDown={(e) => e.key === 'Enter' && updateStock(item.id, editingStock.value)}
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-dem" onClick={() => updateStock(item.id, editingStock.value)}>
                              <Save className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-black ${item.stock <= 5 ? 'text-rep' : 'text-dem'}`}>
                              {item.stock}
                            </span>
                            {item.stock <= 5 && <span className="text-[8px] font-black uppercase text-rep bg-rep/10 px-1 rounded">Low Stock</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-4 font-bold text-foreground">
                        ${(item.price_cents / 100).toFixed(2)}
                      </td>
                      <td className="py-4 font-mono text-xs text-muted-foreground">
                        {item.sku || <span className="italic opacity-50">—</span>}
                      </td>
                      <td className="py-4 text-right">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-muted-foreground hover:text-dem hover:bg-dem/10"
                          onClick={() => setEditingStock({ id: item.id, value: item.stock })}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
              <ClipboardList className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground font-black italic">No inventory records found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryPage;
