import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { 
  Search, 
  User, 
  ChevronLeft, 
  Shield, 
  Activity, 
  AlertTriangle,
  Server,
  Brain,
  Search as SearchIcon,
  FileText,
  Settings,
  Menu,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "../../hooks/use-theme";

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function AppLayout({ children, currentPage, onPageChange }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { id: "overview", label: "Vue d'ensemble", icon: Shield, active: currentPage === "overview" },
    { id: "traffic", label: "Trafic en direct", icon: Activity, active: currentPage === "traffic" },
    { id: "alerts", label: "Alertes", icon: AlertTriangle, active: currentPage === "alerts" },
    { id: "assets", label: "Actifs & Hôtes", icon: Server, active: currentPage === "assets" },
    { id: "model", label: "Modèle (RandomForest)", icon: Brain, active: currentPage === "model" },
    { id: "forensics", label: "Investigation", icon: SearchIcon, active: currentPage === "forensics" },
    { id: "reports", label: "Rapports", icon: FileText, active: currentPage === "reports" },
    { id: "settings", label: "Paramètres", icon: Settings, active: currentPage === "settings" },
  ];

  // Ajouter Design System en mode développement
  if (process.env.NODE_ENV === 'development') {
    navigation.push({ id: "design", label: "Design System", icon: Menu, active: currentPage === "design" });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="font-semibold text-lg">Sentinel IDS</h1>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher IP, hôte, alerte..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch 
                checked={theme === "dark"} 
                onCheckedChange={toggleTheme}
              />
              <Moon className="h-4 w-4" />
            </div>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`sticky top-14 h-[calc(100vh-3.5rem)] bg-sidebar border-r transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        } hidden md:block`}>
          <div className="flex flex-col h-full p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="mb-4 self-end"
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
            </Button>
            
            <nav className="space-y-2 flex-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={item.active ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(item.id)}
                    className={`w-full justify-start ${sidebarCollapsed ? "px-2" : ""}`}
                  >
                    <Icon className={`h-4 w-4 ${sidebarCollapsed ? "" : "mr-2"}`} />
                    {!sidebarCollapsed && item.label}
                  </Button>
                );
              })}
            </nav>

            {/* System Status */}
            <div className={`mt-auto pt-4 border-t ${sidebarCollapsed ? "hidden" : ""}`}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Capteur: En ligne</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                © 2025 Sentinel IDS. Tous droits réservés.
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {!sidebarCollapsed && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden">
            <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-sidebar border-r">
              <div className="flex flex-col h-full p-4">
                <nav className="space-y-2 flex-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        variant={item.active ? "default" : "ghost"}
                        size="sm"
                        onClick={() => {
                          onPageChange(item.id);
                          setSidebarCollapsed(true);
                        }}
                        className="w-full justify-start"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    );
                  })}
                </nav>

                <div className="mt-auto pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    <span>Capteur: En ligne</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    © 2025 Sentinel IDS. Tous droits réservés.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-[1440px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}