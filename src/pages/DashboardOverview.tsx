import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichRechnungspositionen } from '@/lib/enrich';
import type { EnrichedRechnungspositionen } from '@/types/enriched';
import type { Rechnungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { RechnungenDialog } from '@/components/dialogs/RechnungenDialog';
import { RechnungspositionenDialog } from '@/components/dialogs/RechnungspositionenDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  IconAlertCircle, IconPlus, IconPencil, IconTrash, IconReceipt,
  IconSearch, IconUser, IconCalendar, IconCurrencyEuro, IconClockHour4,
  IconChevronRight, IconPackage, IconX,
} from '@tabler/icons-react';

// ---- helpers ----
function getCustomerLabel(r: Rechnungen): string {
  const f = r.fields;
  if (f.kunde_firma) return f.kunde_firma;
  const parts = [f.kunde_vorname, f.kunde_nachname].filter(Boolean);
  return parts.join(' ') || '—';
}

function getMwstRate(key: string | undefined): number {
  if (key === 'mwst_19') return 0.19;
  if (key === 'mwst_7') return 0.07;
  return 0;
}

function calcPositionTotal(pos: EnrichedRechnungspositionen): number {
  const netto = pos.fields.gesamtbetrag_netto ?? (
    (pos.fields.menge ?? 0) * (pos.fields.einzelpreis_netto_pos ?? 0)
  );
  const mwstKey = typeof pos.fields.mwst_satz_pos === 'object'
    ? pos.fields.mwst_satz_pos?.key
    : (pos.fields.mwst_satz_pos as string | undefined);
  return netto * (1 + getMwstRate(mwstKey));
}

function isDueSoon(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

function isOverdue(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ---- main component ----
export default function DashboardOverview() {
  const {
    rechnungen, rechnungspositionen, artikelkatalog,
    rechnungenMap, artikelkatalogMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedRechnungspositionen = enrichRechnungspositionen(rechnungspositionen, { rechnungenMap, artikelkatalogMap });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rechDialogOpen, setRechDialogOpen] = useState(false);
  const [editRechnung, setEditRechnung] = useState<Rechnungen | null>(null);
  const [posDialogOpen, setPosDialogOpen] = useState(false);
  const [editPos, setEditPos] = useState<EnrichedRechnungspositionen | null>(null);
  const [deleteRechnung, setDeleteRechnung] = useState<Rechnungen | null>(null);
  const [deletePos, setDeletePos] = useState<EnrichedRechnungspositionen | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  // KPI stats
  const totalOffene = useMemo(() => {
    return rechnungen.filter(r => !r.fields.faelligkeitsdatum || !isOverdue(r.fields.faelligkeitsdatum)).length;
  }, [rechnungen]);

  const totalUeberfaellig = useMemo(() => {
    return rechnungen.filter(r => isOverdue(r.fields.faelligkeitsdatum)).length;
  }, [rechnungen]);

  const gesamtNetto = useMemo(() => {
    return enrichedRechnungspositionen.reduce((sum, p) => {
      return sum + (p.fields.gesamtbetrag_netto ?? (p.fields.menge ?? 0) * (p.fields.einzelpreis_netto_pos ?? 0));
    }, 0);
  }, [enrichedRechnungspositionen]);

  const filteredRechnungen = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return [...rechnungen].sort((a, b) => (b.fields.rechnungsdatum ?? '').localeCompare(a.fields.rechnungsdatum ?? ''));
    return rechnungen
      .filter(r => {
        const customer = getCustomerLabel(r).toLowerCase();
        const num = (r.fields.rechnungsnummer ?? '').toLowerCase();
        return customer.includes(q) || num.includes(q);
      })
      .sort((a, b) => (b.fields.rechnungsdatum ?? '').localeCompare(a.fields.rechnungsdatum ?? ''));
  }, [rechnungen, search]);

  const selectedRechnung = useMemo(
    () => rechnungen.find(r => r.record_id === selectedId) ?? null,
    [rechnungen, selectedId]
  );

  const selectedPositionen = useMemo(() => {
    if (!selectedId) return [];
    return enrichedRechnungspositionen
      .filter(p => {
        const id = extractRecordId(p.fields.rechnung_zuordnung);
        return id === selectedId;
      })
      .sort((a, b) => (a.fields.positionsnummer ?? 0) - (b.fields.positionsnummer ?? 0));
  }, [enrichedRechnungspositionen, selectedId]);

  const selectedTotal = useMemo(
    () => selectedPositionen.reduce((s, p) => s + calcPositionTotal(p), 0),
    [selectedPositionen]
  );
  const selectedNetto = useMemo(
    () => selectedPositionen.reduce((s, p) => s + (p.fields.gesamtbetrag_netto ?? (p.fields.menge ?? 0) * (p.fields.einzelpreis_netto_pos ?? 0)), 0),
    [selectedPositionen]
  );

  // handlers
  async function handleCreateRechnung(fields: Rechnungen['fields']) {
    await LivingAppsService.createRechnungenEntry(fields);
    fetchAll();
  }

  async function handleUpdateRechnung(fields: Rechnungen['fields']) {
    if (!editRechnung) return;
    await LivingAppsService.updateRechnungenEntry(editRechnung.record_id, fields);
    fetchAll();
  }

  async function handleDeleteRechnung() {
    if (!deleteRechnung) return;
    await LivingAppsService.deleteRechnungenEntry(deleteRechnung.record_id);
    if (selectedId === deleteRechnung.record_id) setSelectedId(null);
    setDeleteRechnung(null);
    fetchAll();
  }

  async function handleCreatePos(fields: EnrichedRechnungspositionen['fields']) {
    await LivingAppsService.createRechnungspositionenEntry(fields);
    fetchAll();
  }

  async function handleUpdatePos(fields: EnrichedRechnungspositionen['fields']) {
    if (!editPos) return;
    await LivingAppsService.updateRechnungspositionenEntry(editPos.record_id, fields);
    fetchAll();
  }

  async function handleDeletePos() {
    if (!deletePos) return;
    await LivingAppsService.deleteRechnungspositionenEntry(deletePos.record_id);
    setDeletePos(null);
    fetchAll();
  }

  function openCreatePos() {
    setEditPos(null);
    setPosDialogOpen(true);
  }

  function openEditPos(p: EnrichedRechnungspositionen) {
    setEditPos(p);
    setPosDialogOpen(true);
  }

  function openEditRechnung(r: Rechnungen) {
    setEditRechnung(r);
    setRechDialogOpen(true);
  }

  function selectRechnung(r: Rechnungen) {
    setSelectedId(r.record_id);
    setMobileDetail(true);
  }

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const dueSoonCount = rechnungen.filter(r => isDueSoon(r.fields.faelligkeitsdatum)).length;

  return (
    <div className="space-y-6 pb-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Rechnungen"
          value={String(rechnungen.length)}
          description="Gesamt"
          icon={<IconReceipt size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Gesamtvolumen"
          value={gesamtNetto >= 1000 ? `${(gesamtNetto / 1000).toFixed(1)}k €` : formatCurrency(gesamtNetto)}
          description="Netto"
          icon={<IconCurrencyEuro size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Fällig bald"
          value={String(dueSoonCount)}
          description="In 7 Tagen"
          icon={<IconClockHour4 size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Überfällig"
          value={String(totalUeberfaellig)}
          description={`${totalOffene} offen`}
          icon={<IconAlertCircle size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Main workspace */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-[520px]">
        {/* Invoice list panel */}
        <div className={`lg:w-80 xl:w-96 flex-shrink-0 flex flex-col bg-card border border-border rounded-2xl overflow-hidden ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border gap-3">
            <h2 className="font-semibold text-sm shrink-0">Rechnungen</h2>
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => { setEditRechnung(null); setRechDialogOpen(true); }}
            >
              <IconPlus size={14} className="shrink-0 mr-1" />
              <span className="hidden sm:inline">Neu</span>
            </Button>
          </div>
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
              <Input
                placeholder="Suchen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredRechnungen.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                <IconReceipt size={40} stroke={1.5} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {search ? 'Keine Treffer gefunden.' : 'Noch keine Rechnungen.'}
                </p>
              </div>
            ) : (
              filteredRechnungen.map(r => {
                const isSelected = r.record_id === selectedId;
                const overdue = isOverdue(r.fields.faelligkeitsdatum);
                const soon = isDueSoon(r.fields.faelligkeitsdatum);
                const posCount = enrichedRechnungspositionen.filter(p => extractRecordId(p.fields.rechnung_zuordnung) === r.record_id).length;
                const total = enrichedRechnungspositionen
                  .filter(p => extractRecordId(p.fields.rechnung_zuordnung) === r.record_id)
                  .reduce((s, p) => s + calcPositionTotal(p), 0);
                return (
                  <button
                    key={r.record_id}
                    onClick={() => selectRechnung(r)}
                    className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors hover:bg-accent/50 ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-sm truncate">{r.fields.rechnungsnummer || '—'}</span>
                          {overdue && <Badge variant="destructive" className="text-[10px] px-1 py-0 shrink-0">Überfällig</Badge>}
                          {!overdue && soon && <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0 border-amber-400 text-amber-600">Bald fällig</Badge>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <IconUser size={11} className="text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">{getCustomerLabel(r)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{formatDate(r.fields.rechnungsdatum)}</span>
                          {posCount > 0 && <span className="text-xs text-muted-foreground">{posCount} Pos.</span>}
                          {total > 0 && <span className="text-xs font-medium text-foreground">{formatCurrency(total)}</span>}
                        </div>
                      </div>
                      <IconChevronRight size={14} className="text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className={`flex-1 min-w-0 flex flex-col bg-card border border-border rounded-2xl overflow-hidden ${mobileDetail ? 'flex' : 'hidden lg:flex'}`}>
          {!selectedRechnung ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <IconReceipt size={32} stroke={1.5} className="text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Rechnung auswählen</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Wähle eine Rechnung aus der Liste, um Details und Positionen anzuzeigen.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditRechnung(null); setRechDialogOpen(true); }}
              >
                <IconPlus size={14} className="mr-1" />
                Neue Rechnung
              </Button>
            </div>
          ) : (
            <>
              {/* Invoice header */}
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {mobileDetail && (
                        <button
                          onClick={() => setMobileDetail(false)}
                          className="lg:hidden p-1 rounded-lg hover:bg-accent transition-colors"
                        >
                          <IconX size={16} className="text-muted-foreground" />
                        </button>
                      )}
                      <h2 className="font-bold text-lg truncate">
                        {selectedRechnung.fields.rechnungsnummer || 'Ohne Nummer'}
                      </h2>
                      {isOverdue(selectedRechnung.fields.faelligkeitsdatum) && (
                        <Badge variant="destructive" className="shrink-0">Überfällig</Badge>
                      )}
                      {!isOverdue(selectedRechnung.fields.faelligkeitsdatum) && isDueSoon(selectedRechnung.fields.faelligkeitsdatum) && (
                        <Badge variant="outline" className="shrink-0 border-amber-400 text-amber-600">Bald fällig</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <IconUser size={13} className="text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">{getCustomerLabel(selectedRechnung)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <IconCalendar size={13} className="text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(selectedRechnung.fields.rechnungsdatum)}
                          {selectedRechnung.fields.faelligkeitsdatum && (
                            <> · fällig {formatDate(selectedRechnung.fields.faelligkeitsdatum)}</>
                          )}
                        </span>
                      </div>
                      {selectedRechnung.fields.zahlungsbedingungen && (
                        <div className="flex items-center gap-1.5">
                          <IconClockHour4 size={13} className="text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {typeof selectedRechnung.fields.zahlungsbedingungen === 'object'
                              ? selectedRechnung.fields.zahlungsbedingungen.label
                              : selectedRechnung.fields.zahlungsbedingungen}
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedRechnung.fields.bemerkungen && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{selectedRechnung.fields.bemerkungen}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditRechnung(selectedRechnung)}
                    >
                      <IconPencil size={14} className="mr-1 shrink-0" />
                      <span className="hidden sm:inline">Bearbeiten</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteRechnung(selectedRechnung)}
                    >
                      <IconTrash size={14} className="mr-1 shrink-0" />
                      <span className="hidden sm:inline">Löschen</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Positions section */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">Positionen</h3>
                <Button size="sm" variant="outline" onClick={openCreatePos}>
                  <IconPlus size={14} className="mr-1 shrink-0" />
                  Position hinzufügen
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {selectedPositionen.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                    <IconPackage size={36} stroke={1.5} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Keine Positionen</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Füge Artikel oder Leistungen hinzu.</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={openCreatePos}>
                      <IconPlus size={14} className="mr-1" />
                      Position hinzufügen
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {selectedPositionen.map(p => {
                      const netto = p.fields.gesamtbetrag_netto ?? ((p.fields.menge ?? 0) * (p.fields.einzelpreis_netto_pos ?? 0));
                      const brutto = calcPositionTotal(p);
                      const mwstLabel = typeof p.fields.mwst_satz_pos === 'object'
                        ? p.fields.mwst_satz_pos?.label
                        : '—';
                      return (
                        <div key={p.record_id} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-accent/30 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-mono text-muted-foreground shrink-0 w-6">
                                {p.fields.positionsnummer ?? '—'}
                              </span>
                              <span className="font-medium text-sm truncate">
                                {p.artikel_auswahlName || 'Artikel'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 ml-8">
                              <span className="text-xs text-muted-foreground">
                                {p.fields.menge} {typeof p.fields.einheit_position === 'object' ? p.fields.einheit_position?.label : p.fields.einheit_position ?? ''}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(p.fields.einzelpreis_netto_pos)} / Einheit
                              </span>
                              <span className="text-xs text-muted-foreground">MwSt. {mwstLabel}</span>
                            </div>
                            {p.fields.positionsnotiz && (
                              <p className="text-xs text-muted-foreground ml-8 mt-0.5 line-clamp-1">{p.fields.positionsnotiz}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="text-sm font-semibold">{formatCurrency(brutto)}</div>
                              {netto !== brutto && (
                                <div className="text-xs text-muted-foreground">{formatCurrency(netto)} netto</div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openEditPos(p)}
                                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                              >
                                <IconPencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeletePos(p)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                              >
                                <IconTrash size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Total footer */}
              {selectedPositionen.length > 0 && (
                <div className="px-5 py-3 border-t border-border bg-muted/30">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">{selectedPositionen.length} Position{selectedPositionen.length !== 1 ? 'en' : ''}</span>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground mr-2">Netto</span>
                        <span className="text-sm font-medium">{formatCurrency(selectedNetto)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground mr-2">Brutto</span>
                        <span className="text-base font-bold text-foreground">{formatCurrency(selectedTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <RechnungenDialog
        open={rechDialogOpen}
        onClose={() => { setRechDialogOpen(false); setEditRechnung(null); }}
        onSubmit={async (fields) => {
          if (editRechnung) {
            await handleUpdateRechnung(fields);
          } else {
            await handleCreateRechnung(fields);
          }
        }}
        defaultValues={editRechnung?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Rechnungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Rechnungen']}
      />

      <RechnungspositionenDialog
        open={posDialogOpen}
        onClose={() => { setPosDialogOpen(false); setEditPos(null); }}
        onSubmit={async (fields) => {
          if (editPos) {
            await handleUpdatePos(fields);
          } else {
            // Inject the selected invoice reference
            const fieldsWithRef = selectedId
              ? { ...fields, rechnung_zuordnung: createRecordUrl(APP_IDS.RECHNUNGEN, selectedId) }
              : fields;
            await handleCreatePos(fieldsWithRef);
          }
        }}
        defaultValues={editPos
          ? editPos.fields
          : (selectedId
            ? { rechnung_zuordnung: createRecordUrl(APP_IDS.RECHNUNGEN, selectedId) }
            : undefined)
        }
        rechnungenList={rechnungen}
        artikelkatalogList={artikelkatalog}
        enablePhotoScan={AI_PHOTO_SCAN['Rechnungspositionen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Rechnungspositionen']}
      />

      <ConfirmDialog
        open={!!deleteRechnung}
        title="Rechnung löschen"
        description={`Rechnung "${deleteRechnung?.fields.rechnungsnummer ?? ''}" wirklich löschen? Alle zugehörigen Positionen bleiben erhalten.`}
        onConfirm={handleDeleteRechnung}
        onClose={() => setDeleteRechnung(null)}
      />

      <ConfirmDialog
        open={!!deletePos}
        title="Position löschen"
        description="Diese Position wirklich löschen?"
        onConfirm={handleDeletePos}
        onClose={() => setDeletePos(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
