import { useState } from "react";
import { ThemeProvider } from "./hooks/use-theme";
import { WebSocketProvider } from "./hooks/WebSocketProvider";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { OverviewPage } from "./components/pages/OverviewPage";
import { LiveTrafficPage } from "./components/pages/LiveTrafficPage";
import { AlertsPage } from "./components/pages/AlertsPage";
import { AssetsPage } from "./components/pages/AssetsPage";
import { ModelPage } from "./components/pages/ModelPage";
import { ForensicsPage } from "./components/pages/ForensicsPage";
import { ReportsPage } from "./components/pages/ReportsPage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { DesignSystemPage } from "./components/pages/DesignSystemPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("overview");

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "overview":
        return <OverviewPage />;
      case "traffic":
        return <LiveTrafficPage />;
      case "alerts":
        return <AlertsPage />;
      case "assets":
        return <AssetsPage />;
      case "model":
        return <ModelPage />;
      case "forensics":
        return <ForensicsPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
      case "design":
        return <DesignSystemPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WebSocketProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <AppLayout currentPage={currentPage} onPageChange={setCurrentPage}>
              <ErrorBoundary>
                {renderCurrentPage()}
              </ErrorBoundary>
            </AppLayout>
          </div>
        </WebSocketProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}