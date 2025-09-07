import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { SeverityBadge } from "../ui/severity-badge";
import { StatusBadge } from "../ui/status-badge";
import { KpiTile } from "../ui/kpi-tile";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { useTheme } from "../../hooks/use-theme";
import { 
  Shield, 
  Activity, 
  AlertTriangle,
  Sun,
  Moon,
  Palette
} from "lucide-react";

export function DesignSystemPage() {
  const { theme, toggleTheme } = useTheme();

  const colors = [
    { name: "Primary", value: "#2563EB", css: "bg-primary" },
    { name: "Primary Hover", value: "#1E40AF", css: "bg-primary/80" },
    { name: "Accent", value: "#10B981", css: "bg-accent" },
    { name: "Warning", value: "#F59E0B", css: "bg-yellow-500" },
    { name: "Danger", value: "#EF4444", css: "bg-destructive" },
    { name: "Surface", value: "#FFFFFF", css: "bg-background" },
    { name: "Surface Alt", value: "#F8FAFC", css: "bg-secondary" },
    { name: "Text Primary", value: "#0F172A", css: "bg-foreground" },
    { name: "Text Secondary", value: "#475569", css: "bg-muted-foreground" },
    { name: "Border", value: "#E2E8F0", css: "bg-border" },
  ];

  const severityLevels: Array<"informational" | "low" | "medium" | "high" | "critical"> = [
    "informational", "low", "medium", "high", "critical"
  ];

  const statusTypes: Array<"new" | "acknowledged" | "suppressed" | "normal" | "attack"> = [
    "new", "acknowledged", "suppressed", "normal", "attack"
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Système de Design Sentinel IDS</h1>
          <p className="text-muted-foreground">
            Composants, couleurs et éléments de l'interface utilisateur
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          <Moon className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            {theme === "dark" ? "Sombre" : "Clair"}
          </span>
        </div>
      </div>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Palette de Couleurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {colors.map((color) => (
              <div key={color.name} className="space-y-2">
                <div 
                  className={`w-full h-16 rounded-lg border ${color.css}`}
                  style={{ backgroundColor: color.name === "Surface" && theme === "dark" ? "#0F172A" : undefined }}
                />
                <div>
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{color.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typographie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1>Titre 1 - Sentinel IDS</h1>
            <p className="text-sm text-muted-foreground">font-size: 2rem, font-weight: medium</p>
          </div>
          <div>
            <h2>Titre 2 - Vue d'ensemble</h2>
            <p className="text-sm text-muted-foreground">font-size: 1.5rem, font-weight: medium</p>
          </div>
          <div>
            <h3>Titre 3 - Alertes de Sécurité</h3>
            <p className="text-sm text-muted-foreground">font-size: 1.25rem, font-weight: medium</p>
          </div>
          <div>
            <h4>Titre 4 - Métriques du Modèle</h4>
            <p className="text-sm text-muted-foreground">font-size: 1rem, font-weight: medium</p>
          </div>
          <div>
            <p>Texte de paragraphe standard utilisé pour les descriptions et le contenu principal.</p>
            <p className="text-sm text-muted-foreground">font-size: 1rem, font-weight: normal</p>
          </div>
          <div>
            <label>Libellé de champ de formulaire</label>
            <p className="text-sm text-muted-foreground">font-size: 1rem, font-weight: medium</p>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Boutons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button size="sm">Petit</Button>
              <Button>Moyen (par défaut)</Button>
              <Button size="lg">Grand</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Défaut</Button>
              <Button variant="secondary">Secondaire</Button>
              <Button variant="outline">Contour</Button>
              <Button variant="ghost">Fantôme</Button>
              <Button variant="destructive">Destructeur</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button><Shield className="h-4 w-4 mr-2" />Avec icône</Button>
              <Button disabled>Désactivé</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges et Indicateurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Badges de Sévérité</h4>
            <div className="flex flex-wrap gap-2">
              {severityLevels.map((severity) => (
                <SeverityBadge key={severity} severity={severity} />
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Badges de Statut</h4>
            <div className="flex flex-wrap gap-2">
              {statusTypes.map((status) => (
                <StatusBadge key={status} status={status} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Badges Standard</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Défaut</Badge>
              <Badge variant="secondary">Secondaire</Badge>
              <Badge variant="outline">Contour</Badge>
              <Badge variant="destructive">Destructeur</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Tiles */}
      <Card>
        <CardHeader>
          <CardTitle>Tuiles KPI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiTile
              title="Paquets/min"
              value={7429}
              delta={{
                value: 250,
                type: "increase",
                label: "vs dernière heure"
              }}
              sparkline={[45, 52, 48, 61, 55, 67, 73, 69, 82, 78, 85, 91]}
            />
            <KpiTile
              title="Alertes Actives"
              value={23}
              delta={{
                value: -5,
                type: "decrease",
                label: "vs hier"
              }}
            />
            <KpiTile
              title="Précision du Modèle"
              value="94.7%"
              delta={{
                value: 0,
                type: "neutral",
                label: "stable"
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Éléments de Formulaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="example-input">Champ de saisie</Label>
              <Input id="example-input" placeholder="Saisissez votre texte..." />
            </div>
            
            <div>
              <Label htmlFor="example-search">Champ de recherche</Label>
              <div className="relative">
                <Input id="example-search" placeholder="Rechercher IP, hôte, alerte..." className="pl-10" />
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div>
            <Label>Commutateur</Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Switch id="switch-1" />
                <Label htmlFor="switch-1">Option activée</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="switch-2" disabled />
                <Label htmlFor="switch-2">Option désactivée</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Curseur de valeur</Label>
            <div className="mt-2 space-y-2">
              <Slider defaultValue={[50]} max={100} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <div>
            <Label>Barre de progression</Label>
            <div className="mt-2 space-y-2">
              <Progress value={33} />
              <Progress value={66} />
              <Progress value={89} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Exemples de Mise en Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Carte avec en-tête et contenu</h4>
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Titre de la Carte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Contenu de la carte avec des informations utiles et des métriques.
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h4 className="font-medium mb-3">Disposition en grille</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm">Élément 1</p>
              </div>
              <div className="bg-muted/30 rounded p-4 text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">Élément 2</p>
              </div>
              <div className="bg-muted/30 rounded p-4 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm">Élément 3</p>
              </div>
              <div className="bg-muted/30 rounded p-4 text-center">
                <Palette className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-sm">Élément 4</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-center text-muted-foreground">
        <p>© 2025 Sentinel IDS - Système de Design v1.0</p>
        <p className="text-sm mt-1">Construit avec React, Tailwind CSS et shadcn/ui</p>
      </div>
    </div>
  );
}