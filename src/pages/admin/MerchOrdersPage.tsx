import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MerchOrderItem {
  item_name: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price_cents: number;
}

interface MerchOrder {
  id: string;
  status: string;
  total_amount_cents: number | null;
  currency: string | null;
  shipping_address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  preferred_contact_method: string | null;
  preferred_contact_value: string | null;
  tracking_number: string | null;
  internal_notes: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  merch_order_items: MerchOrderItem[];
}

const MerchOrdersPage = () => {
  const { toast } = useToast();
  const [merchOrders, setMerchOrders] = useState<MerchOrder[]>([]);
  const [isLoadingMerchOrders, setIsLoadingMerchOrders] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchMerchOrders = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('merch_orders')
          .select(`
            id,
            status,
            total_amount_cents,
            currency,
            shipping_address,
            contact_email,
            contact_phone,
            preferred_contact_method,
            preferred_contact_value,
            tracking_number,
            internal_notes,
            stripe_session_id,
            stripe_payment_intent_id,
            created_at,
            merch_order_items(
              item_name,
              size,
              color,
              quantity,
              price_cents
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMerchOrders((data as unknown as MerchOrder[]) || []);
      } catch (err) {
        console.error('Error fetching merch orders:', err);
        toast({
          title: "Error",
          description: "Could not fetch merch orders",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMerchOrders(false);
      }
    };

    fetchMerchOrders();
  }, [toast]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(orderId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('merch_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setMerchOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      toast({
        title: "Update failed",
        description: "Could not update order status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const updateMerchOrder = async (orderId: string, updates: Partial<MerchOrder>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('merch_orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      setMerchOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      ));

      toast({
        title: "Order updated",
        description: "Order details have been saved successfully",
      });
    } catch (err) {
      console.error('Error updating merch order:', err);
      toast({
        title: "Update failed",
        description: "Could not update order details",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'succeeded':
        return 'bg-dem/10 text-dem';
      case 'failed':
      case 'error':
        return 'bg-rep/10 text-rep';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Merch Orders</h1>
        <ShoppingBag className="w-8 h-8 text-dem" />
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-black text-xl text-foreground">Order Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMerchOrders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-dem" />
            </div>
          ) : merchOrders && merchOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Items</th>
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Customer & Shipping</th>
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Status & Fulfillment</th>
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Financials</th>
                    <th className="pb-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Ordered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {merchOrders.map((order: MerchOrder) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors align-top">
                      <td className="py-4 pr-4">
                        <div className="space-y-2">
                          {order.merch_order_items?.map((item: MerchOrderItem) => (
                            <div key={`${item.item_name}-${item.size}-${item.color}`} className="text-xs bg-muted/50 p-2 rounded border border-border/50">
                              <div className="font-black text-foreground uppercase tracking-tight">{item.item_name}</div>
                              <div className="text-muted-foreground flex gap-2 mt-1">
                                <span className="bg-dem/10 text-dem px-1.5 rounded font-bold">QTY: {item.quantity}</span>
                                {item.size && <span className="bg-muted px-1.5 rounded">SIZE: {item.size}</span>}
                                {item.color && <span className="bg-muted px-1.5 rounded">COLOR: {item.color}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="space-y-3">
                          <div>
                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Contact</div>
                            <div className="font-bold text-foreground truncate max-w-[200px]">{order.contact_email}</div>
                            {order.contact_phone && <div className="text-xs text-muted-foreground">{order.contact_phone}</div>}
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Address</div>
                            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-border/50 whitespace-pre-line leading-relaxed">
                              {order.shipping_address || 'No address provided'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="space-y-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="text-[10px] font-black uppercase text-muted-foreground">Order Status</div>
                            <select 
                              title="Change order status"
                              className="text-[10px] bg-card border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-dem font-bold uppercase tracking-wider"
                              value={order.status}
                              disabled={isUpdatingStatus === order.id}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <span className={`w-fit px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${getStatusColor(order.status)}`}>
                              Current: {order.status}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="text-[10px] font-black uppercase text-muted-foreground">Tracking Number</div>
                            <Input 
                              placeholder="Enter tracking #"
                              className="h-7 text-[10px] bg-muted/30"
                              defaultValue={order.tracking_number || ''}
                              onBlur={(e) => updateMerchOrder(order.id, { tracking_number: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="text-[10px] font-black uppercase text-muted-foreground">Internal Notes</div>
                            <Textarea 
                              placeholder="Add notes..."
                              className="min-h-[60px] text-[10px] bg-muted/30 py-1"
                              defaultValue={order.internal_notes || ''}
                              onBlur={(e) => updateMerchOrder(order.id, { internal_notes: e.target.value })}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="space-y-3">
                          <div>
                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Paid</div>
                            <div className="text-xl font-black text-dem">
                              {order.total_amount_cents ? `${(order.total_amount_cents / 100).toFixed(2)}` : '0.00'}
                              <span className="text-[10px] ml-1 opacity-60">{order.currency?.toUpperCase() || 'USD'}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Stripe Ref</div>
                            {order.stripe_payment_intent_id ? (
                              <a 
                                href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-mono text-dem hover:underline flex items-center gap-1"
                              >
                                {order.stripe_payment_intent_id.substring(0, 12)}...
                                <ExternalLink className="w-2 h-2" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">No Stripe link</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="text-xs font-bold text-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </div>
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[9px] font-black uppercase border-dem/20 text-dem hover:bg-dem/10"
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            disabled={order.status === 'shipped' || order.status === 'delivered'}
                          >
                            Mark Shipped
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground font-black italic">No merch orders found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchOrdersPage;
