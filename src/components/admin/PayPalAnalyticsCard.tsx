
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PayPalEventType } from "@/types/paypal";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FunnelData {
  intake_created: number;
  redirected_to_paypal: number;
  returned_from_paypal: number;
  marked_paid: number;
}

export function PayPalAnalyticsCard() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Fetch all events from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
          .from('placement_order_events')
          .select('event_type')
          .gte('created_at', thirtyDaysAgo.toISOString());

        if (error) throw error;

        const counts: FunnelData = {
          intake_created: 0,
          redirected_to_paypal: 0,
          returned_from_paypal: 0,
          marked_paid: 0,
        };

        // Aggregate counts
        data.forEach((event: { event_type: PayPalEventType }) => {
          if (Object.prototype.hasOwnProperty.call(counts, event.event_type)) {
            counts[event.event_type as keyof FunnelData]++;
          }
        });

        setFunnelData(counts);
      } catch (err) {
        console.error("Failed to fetch PayPal analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PayPal Funnel (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!funnelData) return null;

  const conversionRate = funnelData.intake_created > 0 
    ? ((funnelData.marked_paid / funnelData.intake_created) * 100).toFixed(1) 
    : "0.0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>PayPal Funnel (Last 30 Days)</CardTitle>
        <CardDescription>Conversion Rate: {conversionRate}%</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Intake Started</span>
            <span className="font-bold">{funnelData.intake_created}</span>
          </div>
          <Progress value={100} className="h-2" indicatorClassName="bg-blue-200" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Redirected to PayPal</span>
            <span className="font-bold">{funnelData.redirected_to_paypal}</span>
          </div>
          <Progress 
            value={funnelData.intake_created ? (funnelData.redirected_to_paypal / funnelData.intake_created) * 100 : 0} 
            className="h-2" 
            indicatorClassName="bg-blue-400" 
          />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Returned from PayPal</span>
            <span className="font-bold">{funnelData.returned_from_paypal}</span>
          </div>
          <Progress 
            value={funnelData.intake_created ? (funnelData.returned_from_paypal / funnelData.intake_created) * 100 : 0} 
            className="h-2" 
            indicatorClassName="bg-blue-600" 
          />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-600">Marked Paid (Confirmed)</span>
            <span className="font-bold text-green-600">{funnelData.marked_paid}</span>
          </div>
          <Progress 
            value={funnelData.intake_created ? (funnelData.marked_paid / funnelData.intake_created) * 100 : 0} 
            className="h-2" 
            indicatorClassName="bg-green-600" 
          />
        </div>
      </CardContent>
    </Card>
  );
}
