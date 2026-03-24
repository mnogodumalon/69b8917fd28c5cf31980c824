import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Rechnungen, Rechnungspositionen, Artikelkatalog } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [rechnungen, setRechnungen] = useState<Rechnungen[]>([]);
  const [rechnungspositionen, setRechnungspositionen] = useState<Rechnungspositionen[]>([]);
  const [artikelkatalog, setArtikelkatalog] = useState<Artikelkatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [rechnungenData, rechnungspositionenData, artikelkatalogData] = await Promise.all([
        LivingAppsService.getRechnungen(),
        LivingAppsService.getRechnungspositionen(),
        LivingAppsService.getArtikelkatalog(),
      ]);
      setRechnungen(rechnungenData);
      setRechnungspositionen(rechnungspositionenData);
      setArtikelkatalog(artikelkatalogData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [rechnungenData, rechnungspositionenData, artikelkatalogData] = await Promise.all([
          LivingAppsService.getRechnungen(),
          LivingAppsService.getRechnungspositionen(),
          LivingAppsService.getArtikelkatalog(),
        ]);
        setRechnungen(rechnungenData);
        setRechnungspositionen(rechnungspositionenData);
        setArtikelkatalog(artikelkatalogData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const rechnungenMap = useMemo(() => {
    const m = new Map<string, Rechnungen>();
    rechnungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [rechnungen]);

  const artikelkatalogMap = useMemo(() => {
    const m = new Map<string, Artikelkatalog>();
    artikelkatalog.forEach(r => m.set(r.record_id, r));
    return m;
  }, [artikelkatalog]);

  return { rechnungen, setRechnungen, rechnungspositionen, setRechnungspositionen, artikelkatalog, setArtikelkatalog, loading, error, fetchAll, rechnungenMap, artikelkatalogMap };
}