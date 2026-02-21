import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { PlacementOrder } from "@/types/paypal";
import { trackPayPalEvent } from "@/lib/paypal-analytics";
import { PayPalAnalyticsCard } from "@/components/admin/PayPalAnalyticsCard";

export default function PayPalOrdersPage() {
  const [orders, setOrders] = useState<PlacementOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending_paypal");
  const [selectedOrder, setSelectedOrder] = useState<PlacementOrder | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("placement_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data as unknown as PlacementOrder[]);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleMarkAsPaid = async () => {
    if (!selectedOrder) return;
    setProcessingId(selectedOrder.id);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("placement_orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          paypal_transaction_id: transactionId || null,
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      // Track: marked_paid
      await trackPayPalEvent(selectedOrder.order_id, 'marked_paid', {
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        paypal_transaction_id: transactionId,
      });

      toast.success("Order marked as paid");
      setIsConfirmDialogOpen(false);
      setTransactionId("");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PayPal Orders</h1>
          <p className="text-muted-foreground">
            Manual reconciliation for PayPal stabilizer flow.
          </p>
        </div>
        <div className="flex justify-end">
          <PayPalAnalyticsCard />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant={filterStatus === "pending_paypal" ? "default" : "outline"}
            onClick={() => setFilterStatus("pending_paypal")}
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === "paid" ? "default" : "outline"}
            onClick={() => setFilterStatus("paid")}
          >
            Paid
          </Button>
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
          >
            All
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Slot / Item</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.order_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.artist_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{order.slot_type}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={order.notes || ""}>
                    {order.notes || "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === "pending_paypal" && (
                      <Dialog
                        open={isConfirmDialogOpen && selectedOrder?.id === order.id}
                        onOpenChange={(open) => {
                          setIsConfirmDialogOpen(open);
                          if (open) setSelectedOrder(order);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Mark Paid
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Payment</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="txn_id">
                                PayPal Transaction ID (Optional)
                              </Label>
                              <Input
                                id="txn_id"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="e.g. 5X1234567890"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsConfirmDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleMarkAsPaid}
                              disabled={processingId === order.id}
                            >
                              {processingId === order.id && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Confirm & Mark Paid
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
