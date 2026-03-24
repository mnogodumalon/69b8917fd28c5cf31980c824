import type { Rechnungspositionen } from './app';

export type EnrichedRechnungspositionen = Rechnungspositionen & {
  rechnung_zuordnungName: string;
  artikel_auswahlName: string;
};
