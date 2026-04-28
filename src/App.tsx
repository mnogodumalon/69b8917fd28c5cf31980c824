import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import RechnungenPage from '@/pages/RechnungenPage';
import RechnungspositionenPage from '@/pages/RechnungspositionenPage';
import ArtikelkatalogPage from '@/pages/ArtikelkatalogPage';
import PublicFormRechnungen from '@/pages/public/PublicForm_Rechnungen';
import PublicFormRechnungspositionen from '@/pages/public/PublicForm_Rechnungspositionen';
import PublicFormArtikelkatalog from '@/pages/public/PublicForm_Artikelkatalog';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/69b89166574efe552fa528fa" element={<PublicFormRechnungen />} />
              <Route path="public/69b8916778e07ae8842ea5b9" element={<PublicFormRechnungspositionen />} />
              <Route path="public/69b8916378e0e1c2eef5283c" element={<PublicFormArtikelkatalog />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="rechnungen" element={<RechnungenPage />} />
                <Route path="rechnungspositionen" element={<RechnungspositionenPage />} />
                <Route path="artikelkatalog" element={<ArtikelkatalogPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
              {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
