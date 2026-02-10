import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Slot } from '@/types/slots';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Settings2, Save, Trash2, Loader2 } from 'lucide-react';

export const SlotManager = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchSlots(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchSlots = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      interface PostgrestBuilderWithAbort {
        abortSignal: (s?: AbortSignal) => Promise<{ data: unknown[] | null; error: unknown }>;
      }

      const { data, error } = await (supabase
        .from('slots')
        .select('*')
        .order('created_at', { ascending: false }) as unknown as PostgrestBuilderWithAbort)
        .abortSignal(signal);
      
      if (data) setSlots(data as unknown as Slot[]);
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
        return;
      }
      console.error("Error fetching slots:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-dem uppercase">Programmable Slots</h2>
          <p className="text-sm text-muted-foreground font-bold">Manage access, monetization, and programming blocks.</p>
        </div>
        <Button className="rounded-full bg-dem hover:bg-dem/90 text-white font-black uppercase tracking-widest text-xs">
          <Plus className="w-4 h-4 mr-2" />
          Create New Slot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-dem" />
          </div>
        ) : slots.map((slot) => (
          <Card key={slot.id} className="border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  slot.is_active ? 'bg-dem/10 text-dem border border-dem/20' : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {slot.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-dem">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg font-black mt-2 text-dem uppercase">{slot.name}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">/{slot.slug}</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-bold uppercase tracking-widest">Visibility</span>
                <span className="font-black text-foreground uppercase">{slot.visibility}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-bold uppercase tracking-widest">Model</span>
                <span className="font-black text-foreground uppercase">{slot.monetization_model}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-bold uppercase tracking-widest">Price</span>
                <span className="font-black text-foreground">{slot.price ? `$${slot.price}` : 'Free'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
