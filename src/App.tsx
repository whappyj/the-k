import { AppDataProvider } from '@/hooks/useAppData';
import { ToastProvider } from '@/hooks/useToast';
import { ConfirmProvider } from '@/hooks/useConfirm';
import { PendingEditProvider } from '@/hooks/usePendingEdit';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from '@/components/ui/toaster';
import { useRoute } from '@/hooks/useRoute';
import { useThemeEffect } from '@/hooks/useThemeEffect';
import type { Route } from '@/types';

import { HomePage } from '@/pages/Home';
import { EstimatePage } from '@/pages/Estimate';
import { ExperiencePage } from '@/pages/Experience';
import { AnalysisPage } from '@/pages/Analysis';
import { Calculator24Page } from '@/pages/Calculator24';
import { AdenaPurchasePage } from '@/pages/AdenaPurchase';
import { SettingsPage } from '@/pages/Settings';

function RouteView({ route }: { route: Route }) {
  switch (route) {
    case 'home':
      return <HomePage />;
    case 'estimate':
      return <EstimatePage />;
    case 'experience':
      return <ExperiencePage />;
    case 'analysis':
      return <AnalysisPage />;
    case 'calculator':
      return <Calculator24Page />;
    case 'adenaPurchase':
      return <AdenaPurchasePage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <HomePage />;
  }
}

function Shell() {
  const [route, navigate] = useRoute();
  useThemeEffect();

  return (
    <AppShell route={route} onNavigate={navigate}>
      <RouteView route={route} />
    </AppShell>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <ToastProvider>
        <ConfirmProvider>
          <PendingEditProvider>
            <Shell />
            <Toaster />
          </PendingEditProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AppDataProvider>
  );
}
