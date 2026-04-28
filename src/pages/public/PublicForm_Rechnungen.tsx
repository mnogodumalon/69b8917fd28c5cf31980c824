import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { lookupKey } from '@/lib/formatters';

// Empty PROXY_BASE → relative URLs (dashboard and form-proxy share the domain).
const PROXY_BASE = '';
const APP_ID = '69b89166574efe552fa528fa';
const SUBMIT_PATH = `/rest/apps/${APP_ID}/records`;
const ALTCHA_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js';

async function submitPublicForm(fields: Record<string, unknown>, captchaToken: string) {
  const res = await fetch(`${PROXY_BASE}/api${SUBMIT_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Captcha-Token': captchaToken,
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Submission failed');
  }
  return res.json();
}


function cleanFields(fields: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (typeof value === 'object' && !Array.isArray(value) && 'key' in (value as any)) {
      cleaned[key] = (value as any).key;
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item =>
        typeof item === 'object' && item !== null && 'key' in item ? item.key : item
      );
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export default function PublicFormRechnungen() {
  const [fields, setFields] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<HTMLElement | null>(null);

  // Load the ALTCHA web component script once per page.
  useEffect(() => {
    if (document.querySelector(`script[src="${ALTCHA_SCRIPT_SRC}"]`)) return;
    const s = document.createElement('script');
    s.src = ALTCHA_SCRIPT_SRC;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return;
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    const prefill: Record<string, any> = {};
    params.forEach((value, key) => { prefill[key] = value; });
    if (Object.keys(prefill).length) setFields(prev => ({ ...prefill, ...prev }));
  }, []);

  function readCaptchaToken(): string | null {
    const el = captchaRef.current as any;
    if (!el) return null;
    return el.value || el.getAttribute('value') || null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = readCaptchaToken();
    if (!token) {
      setError('Bitte warte auf die Spam-Prüfung und versuche es erneut.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitPublicForm(cleanFields(fields), token);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Vielen Dank!</h2>
          <p className="text-muted-foreground">Deine Eingabe wurde erfolgreich übermittelt.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setFields({}); }}>
            Weitere Eingabe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Rechnungen — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="rechnungsnummer">Rechnungsnummer</Label>
            <Input
              id="rechnungsnummer"
              value={fields.rechnungsnummer ?? ''}
              onChange={e => setFields(f => ({ ...f, rechnungsnummer: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rechnungsdatum">Rechnungsdatum</Label>
            <Input
              id="rechnungsdatum"
              type="date"
              value={fields.rechnungsdatum ?? ''}
              onChange={e => setFields(f => ({ ...f, rechnungsdatum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faelligkeitsdatum">Fälligkeitsdatum</Label>
            <Input
              id="faelligkeitsdatum"
              type="date"
              value={fields.faelligkeitsdatum ?? ''}
              onChange={e => setFields(f => ({ ...f, faelligkeitsdatum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kunde_vorname">Vorname des Kunden</Label>
            <Input
              id="kunde_vorname"
              value={fields.kunde_vorname ?? ''}
              onChange={e => setFields(f => ({ ...f, kunde_vorname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kunde_nachname">Nachname des Kunden</Label>
            <Input
              id="kunde_nachname"
              value={fields.kunde_nachname ?? ''}
              onChange={e => setFields(f => ({ ...f, kunde_nachname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kunde_firma">Firma</Label>
            <Input
              id="kunde_firma"
              value={fields.kunde_firma ?? ''}
              onChange={e => setFields(f => ({ ...f, kunde_firma: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kunde_email">E-Mail-Adresse</Label>
            <Input
              id="kunde_email"
              type="email"
              value={fields.kunde_email ?? ''}
              onChange={e => setFields(f => ({ ...f, kunde_email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kunde_telefon">Telefonnummer</Label>
            <Input
              id="kunde_telefon"
              value={fields.kunde_telefon ?? ''}
              onChange={e => setFields(f => ({ ...f, kunde_telefon: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kunde_strasse">Straße</Label>
            <Input
              id="kunde_strasse"
              value={fields.kunde_strasse ?? ''}
              onChange={e => setFields(f => ({ ...f, kunde_strasse: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kunde_hausnummer">Hausnummer</Label>
            <Input
              id="kunde_hausnummer"
              value={fields.kunde_hausnummer ?? ''}
              onChange={e => setFields(f => ({ ...f, kunde_hausnummer: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kunde_plz">Postleitzahl</Label>
            <Input
              id="kunde_plz"
              value={fields.kunde_plz ?? ''}
              onChange={e => setFields(f => ({ ...f, kunde_plz: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kunde_ort">Ort</Label>
            <Input
              id="kunde_ort"
              value={fields.kunde_ort ?? ''}
              onChange={e => setFields(f => ({ ...f, kunde_ort: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zahlungsbedingungen">Zahlungsbedingungen</Label>
            <Select
              value={lookupKey(fields.zahlungsbedingungen) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, zahlungsbedingungen: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="zahlungsbedingungen"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="sofort">Sofort fällig</SelectItem>
                <SelectItem value="tage_7">7 Tage netto</SelectItem>
                <SelectItem value="tage_14">14 Tage netto</SelectItem>
                <SelectItem value="tage_30">30 Tage netto</SelectItem>
                <SelectItem value="tage_60">60 Tage netto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankverbindung">Bankverbindung / IBAN</Label>
            <Input
              id="bankverbindung"
              value={fields.bankverbindung ?? ''}
              onChange={e => setFields(f => ({ ...f, bankverbindung: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bemerkungen">Bemerkungen</Label>
            <Textarea
              id="bemerkungen"
              value={fields.bemerkungen ?? ''}
              onChange={e => setFields(f => ({ ...f, bemerkungen: e.target.value }))}
              rows={3}
            />
          </div>

          <altcha-widget
            ref={captchaRef as any}
            challengeurl={`${PROXY_BASE}/api/_challenge?path=${encodeURIComponent(SUBMIT_PATH)}`}
            auto="onsubmit"
            hidefooter
          />

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Wird gesendet...' : 'Absenden'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Powered by Klar
        </p>
      </div>
    </div>
  );
}
