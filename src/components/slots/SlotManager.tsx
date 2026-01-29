import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Slot } from '@/types/slots';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Settings2, Save, Trash2 } from 'lucide-react';

export const SlotManager = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      // @ts-expect-error - slots table is not in the generated types
      .from('slots')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setSlots(data as unknown as Slot[]);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-foreground">Programmable Slots</h2>
          <p className="text-sm text-muted-foreground font-body">Manage access, monetization, and programming blocks.</p>
        </div>
        <Button className="rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          Create New Slot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slots.map((slot) => (
          <Card key={slot.id} className="border-border bg-card/50 overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  slot.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'
                }`}>
                  {slot.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg font-display mt-2">{slot.name}</CardTitle>
              <p className="text-xs text-muted-foreground font-body">/{slot.slug}</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-body">Visibility</span>
                <span className="font-semibold text-foreground uppercase">{slot.visibility}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-body">Model</span>
                <span className="font-semibold text-foreground uppercase">{slot.monetization_model}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-body">Price</span>
                <span className="font-semibold text-foreground">{slot.price ? `$${slot.price}` : 'Free'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
