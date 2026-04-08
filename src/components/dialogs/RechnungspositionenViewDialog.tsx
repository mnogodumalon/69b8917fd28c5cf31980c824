import type { Rechnungspositionen, Rechnungen, Artikelkatalog } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface RechnungspositionenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Rechnungspositionen | null;
  onEdit: (record: Rechnungspositionen) => void;
  rechnungenList: Rechnungen[];
  artikelkatalogList: Artikelkatalog[];
}

export function RechnungspositionenViewDialog({ open, onClose, record, onEdit, rechnungenList, artikelkatalogList }: RechnungspositionenViewDialogProps) {
  function getRechnungenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return rechnungenList.find(r => r.record_id === id)?.fields.rechnungsnummer ?? '—';
  }

  function getArtikelkatalogDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return artikelkatalogList.find(r => r.record_id === id)?.fields.artikelnummer ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rechnungspositionen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rechnung</Label>
            <p className="text-sm">{getRechnungenDisplayName(record.fields.rechnung_zuordnung)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Positionsnummer</Label>
            <p className="text-sm">{record.fields.positionsnummer ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Artikel</Label>
            <p className="text-sm">{getArtikelkatalogDisplayName(record.fields.artikel_auswahl)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Menge</Label>
            <p className="text-sm">{record.fields.menge ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einheit</Label>
            <Badge variant="secondary">{record.fields.einheit_position?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Netto-Einzelpreis (€)</Label>
            <p className="text-sm">{record.fields.einzelpreis_netto_pos ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mehrwertsteuersatz</Label>
            <Badge variant="secondary">{record.fields.mwst_satz_pos?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gesamtbetrag Netto (€)</Label>
            <p className="text-sm">{record.fields.gesamtbetrag_netto ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notiz zur Position</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.positionsnotiz ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}