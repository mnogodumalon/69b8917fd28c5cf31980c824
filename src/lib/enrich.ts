import type { EnrichedRechnungspositionen } from '@/types/enriched';
import type { Artikelkatalog, Rechnungen, Rechnungspositionen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface RechnungspositionenMaps {
  rechnungenMap: Map<string, Rechnungen>;
  artikelkatalogMap: Map<string, Artikelkatalog>;
}

export function enrichRechnungspositionen(
  rechnungspositionen: Rechnungspositionen[],
  maps: RechnungspositionenMaps
): EnrichedRechnungspositionen[] {
  return rechnungspositionen.map(r => ({
    ...r,
    rechnung_zuordnungName: resolveDisplay(r.fields.rechnung_zuordnung, maps.rechnungenMap, 'rechnungsnummer'),
    artikel_auswahlName: resolveDisplay(r.fields.artikel_auswahl, maps.artikelkatalogMap, 'artikelnummer'),
  }));
}
