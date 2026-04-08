import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import RechnungenPage from '@/pages/RechnungenPage';
import RechnungspositionenPage from '@/pages/RechnungspositionenPage';
import ArtikelkatalogPage from '@/pages/ArtikelkatalogPage';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="rechnungen" element={<RechnungenPage />} />
              <Route path="rechnungspositionen" element={<RechnungspositionenPage />} />
              <Route path="artikelkatalog" element={<ArtikelkatalogPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
