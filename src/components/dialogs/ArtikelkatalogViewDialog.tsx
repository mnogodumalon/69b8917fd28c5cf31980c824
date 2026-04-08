import type { Artikelkatalog } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface ArtikelkatalogViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Artikelkatalog | null;
  onEdit: (record: Artikelkatalog) => void;
}

export function ArtikelkatalogViewDialog({ open, onClose, record, onEdit }: ArtikelkatalogViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Artikelkatalog anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Artikelnummer</Label>
            <p className="text-sm">{record.fields.artikelnummer ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bezeichnung</Label>
            <p className="text-sm">{record.fields.bezeichnung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einheit</Label>
            <Badge variant="secondary">{record.fields.einheit?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Netto-Einzelpreis (€)</Label>
            <p className="text-sm">{record.fields.einzelpreis_netto ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mehrwertsteuersatz</Label>
            <Badge variant="secondary">{record.fields.mwst_satz?.label ?? '—'}</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}