'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { getCartDeliveryQuotes, setCartShippingRate } from '@/lib/actions/courier.actions';
import type { CourierRate } from '@/lib/courier/the-courier-guy';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

export default function DeliveryOptions({ selectedAmount }: { selectedAmount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<CourierRate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const res = await getCartDeliveryQuotes();
      if (!active) return;
      if (res.success) {
        setRates(res.rates);
        setError(null);
        // Auto-apply the cheapest option if no shipping chosen yet
        if (res.rates.length > 0 && (!selectedAmount || selectedAmount === 0)) {
          await applyRate(res.rates[0], true);
        }
      } else {
        setError(res.error || 'Could not get delivery rates');
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyRate = async (rate: CourierRate, silent = false) => {
    setApplying(rate.code);
    const res = await setCartShippingRate(rate.amount);
    if (res.success) {
      if (!silent) toast.success(`Delivery: ${rate.name} — ${formatCurrency(rate.amount)}`);
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to apply delivery rate');
    }
    setApplying(null);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h2 className="text-xl">Delivery</h2>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" /> Getting delivery options…
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && rates.length === 0 && (
          <p className="text-sm text-muted-foreground">No delivery options available for this address.</p>
        )}

        <div className="space-y-2">
          {rates.map((rate) => {
            const isSelected = Math.abs(rate.amount - selectedAmount) < 0.001;
            return (
              <label
                key={rate.code}
                className={`flex items-center justify-between gap-3 rounded-md border p-3 cursor-pointer ${isSelected ? 'border-chart-2 bg-chart-2/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="deliveryRate"
                    checked={isSelected}
                    onChange={() => applyRate(rate)}
                    disabled={applying !== null}
                  />
                  <div>
                    <div className="font-medium">{rate.name}</div>
                    {rate.description && (
                      <div className="text-xs text-muted-foreground">{rate.description}</div>
                    )}
                  </div>
                </div>
                <div className="font-semibold">{formatCurrency(rate.amount)}</div>
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
