import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Badge } from "../ui/badge";
import { 
  Settings, 
  Activity, 
  Shield, 
  Database,
  Key,
  Webhook,
  Save,
  RotateCcw
} from "lucide-react";

export function SettingsPage() {
  const [sensorStatus, setSensorStatus] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState([2]);
  const [attackThreshold, setAttackThreshold] = useState([0.8]);
  const [dataRetention, setDataRetention] = useState("90");
  const [apiKey, setApiKey] = useState("sk-************************abcd");
  const [webhookUrl, setWebhookUrl] = useState("");

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log("Saving settings...");
  };

  const handleReset = () => {
    // Reset to defaults
    setSensorStatus(true);
    setRefreshInterval([2]);
    setAttackThreshold([0.8]);
    setDataRetention("90");
    setWebhookUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Paramètres</h1>
          <p className="text-muted-foreground">
            Configuration du système Sentinel IDS
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensors Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Configuration des Capteurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sensor-status" className="text-base font-medium">
                  Statut du Capteur
                </Label>
                <p className="text-sm text-muted-foreground">
                  Activer ou désactiver la capture de paquets
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="sensor-status"
                  checked={sensorStatus}
                  onCheckedChange={setSensorStatus}
                />
                <Badge variant={sensorStatus ? "default" : "secondary"}>
                  {sensorStatus ? "En ligne" : "Hors ligne"}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Interface Réseau</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Interface de capture des paquets
              </p>
              <div className="flex items-center gap-2">
                <Input value="eth0" readOnly />
                <Badge variant="outline">Actif</Badge>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">
                Intervalle de Rafraîchissement: {refreshInterval[0]}s
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Fréquence de mise à jour des données en temps réel
              </p>
              <Slider
                value={refreshInterval}
                onValueChange={setRefreshInterval}
                max={10}
                min={1}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1s</span>
                <span>10s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seuils d'Alerte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium">
                Seuil de Probabilité d'Attaque: {(attackThreshold[0] * 100).toFixed(0)}%
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Probabilité minimum pour générer une alerte
              </p>
              <Slider
                value={attackThreshold}
                onValueChange={setAttackThreshold}
                max={1}
                min={0.1}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Seuils par Sévérité</Label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Critique:</span>
                  <span className="font-mono">≥ 95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Élevé:</span>
                  <span className="font-mono">90-94%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Moyen:</span>
                  <span className="font-mono">85-89%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Faible:</span>
                  <span className="font-mono">{(attackThreshold[0] * 100).toFixed(0)}-84%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Rétention des Données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="data-retention" className="text-base font-medium">
                Période de Rétention (jours)
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Durée de conservation des données de trafic
              </p>
              <Input
                id="data-retention"
                type="number"
                value={dataRetention}
                onChange={(e) => setDataRetention(e.target.value)}
                placeholder="90"
              />
            </div>
            <div>
              <Label className="text-base font-medium">Espace Utilisé</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Stockage actuellement utilisé
              </p>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>2.4 GB / 10 GB</span>
                  <span>24%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "24%" }} />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-base font-medium">Purge Automatique</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Suppression automatique des anciennes données
              </p>
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Badge variant="default">Activée</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API & Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API et Intégrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="api-key" className="text-base font-medium">
              Clé API
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Clé d'authentification pour l'API REST
            </p>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
              <Button variant="outline">
                Régénérer
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="webhook-url" className="text-base font-medium">
              <Webhook className="h-4 w-4 inline mr-1" />
              URL de Webhook
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              URL de notification pour les alertes critiques
            </p>
            <Input
              id="webhook-url"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://votre-service.com/webhook"
            />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Les webhooks permettent de recevoir des notifications en temps réel pour les alertes de haute sévérité.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Tester le Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Modifications des Paramètres</p>
              <p className="text-sm text-muted-foreground">
                Sauvegarder ou réinitialiser la configuration système
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}