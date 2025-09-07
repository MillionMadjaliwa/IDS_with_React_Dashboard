import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon,
  Mail,
  Settings,
  Clock
} from "lucide-react";

export function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeWindow, setTimeWindow] = useState("24h");
  const [scope, setScope] = useState("all");
  const [sections, setSections] = useState({
    trafficKpis: true,
    alertsSummary: true,
    topTalkers: true,
    modelMetrics: true,
  });

  const handleSectionChange = (section: string, checked: boolean) => {
    setSections(prev => ({
      ...prev,
      [section]: checked
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rapports</h1>
          <p className="text-muted-foreground">
            Génération de rapports de sécurité personnalisés
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Assistant de Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Time Window */}
            <div>
              <label className="text-sm font-medium mb-2 block">Fenêtre Temporelle</label>
              <Select value={timeWindow} onValueChange={setTimeWindow}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 dernière heure</SelectItem>
                  <SelectItem value="6h">6 dernières heures</SelectItem>
                  <SelectItem value="24h">24 dernières heures</SelectItem>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
              
              {timeWindow === "custom" && (
                <div className="mt-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? selectedDate.toLocaleDateString('fr-FR') : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Scope */}
            <div>
              <label className="text-sm font-medium mb-2 block">Périmètre</label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout le réseau</SelectItem>
                  <SelectItem value="host">Hôte spécifique</SelectItem>
                  <SelectItem value="subnet">Sous-réseau</SelectItem>
                  <SelectItem value="critical">Actifs critiques seulement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sections to Include */}
            <div>
              <label className="text-sm font-medium mb-3 block">Sections à Inclure</label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trafficKpis"
                    checked={sections.trafficKpis}
                    onCheckedChange={(checked) => handleSectionChange('trafficKpis', !!checked)}
                  />
                  <label htmlFor="trafficKpis" className="text-sm">KPI de Trafic</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alertsSummary"
                    checked={sections.alertsSummary}
                    onCheckedChange={(checked) => handleSectionChange('alertsSummary', !!checked)}
                  />
                  <label htmlFor="alertsSummary" className="text-sm">Résumé des Alertes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="topTalkers"
                    checked={sections.topTalkers}
                    onCheckedChange={(checked) => handleSectionChange('topTalkers', !!checked)}
                  />
                  <label htmlFor="topTalkers" className="text-sm">Top Communicants</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="modelMetrics"
                    checked={sections.modelMetrics}
                    onCheckedChange={(checked) => handleSectionChange('modelMetrics', !!checked)}
                  />
                  <label htmlFor="modelMetrics" className="text-sm">Métriques du Modèle</label>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button className="w-full" size="lg">
              <FileText className="h-4 w-4 mr-2" />
              Générer le Rapport PDF
            </Button>
          </CardContent>
        </Card>

        {/* Output Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Options de Sortie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="font-medium mb-3">Actions Rapides</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Rapport Quotidien (PDF)
                  <Badge variant="secondary" className="ml-auto">Prêt</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Rapport Hebdomadaire (PDF)
                  <Badge variant="outline" className="ml-auto">En cours...</Badge>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Rapport Mensuel (PDF)
                  <Badge variant="secondary" className="ml-auto">Programmé</Badge>
                </Button>
              </div>
            </div>

            {/* Email Schedule */}
            <div>
              <h3 className="font-medium mb-3">Programmation Email</h3>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Email Hebdomadaire</span>
                  <Badge variant="outline" className="ml-auto">Désactivé</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Recevez automatiquement un rapport de sécurité hebdomadaire par email.
                </p>
                <Button variant="outline" size="sm" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Programmer l'Envoi Hebdomadaire
                </Button>
              </div>
            </div>

            {/* Recent Reports */}
            <div>
              <h3 className="font-medium mb-3">Rapports Récents</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Rapport de Sécurité - 2025-01-15</p>
                    <p className="text-xs text-muted-foreground">Généré il y a 2 heures</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Rapport Hebdomadaire - Semaine 2</p>
                    <p className="text-xs text-muted-foreground">Généré il y a 1 jour</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Analyse des Incidents - 2025-01-10</p>
                    <p className="text-xs text-muted-foreground">Généré il y a 5 jours</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Templates */}
            <div>
              <h3 className="font-medium mb-3">Modèles de Rapport</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">Exécutif</Button>
                <Button variant="outline" size="sm">Technique</Button>
                <Button variant="outline" size="sm">Conformité</Button>
                <Button variant="outline" size="sm">Incident</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu du Rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6">
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-semibold">Rapport de Sécurité Sentinel IDS</h2>
                <p className="text-muted-foreground">
                  Période: {timeWindow === "24h" ? "24 dernières heures" : timeWindow} • 
                  Généré le {new Date().toLocaleDateString('fr-FR')}
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sections.trafficKpis && (
                  <div className="text-center">
                    <div className="text-2xl font-semibold">7,429</div>
                    <div className="text-sm text-muted-foreground">Paquets Analysés</div>
                  </div>
                )}
                {sections.alertsSummary && (
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-yellow-600">23</div>
                    <div className="text-sm text-muted-foreground">Alertes Générées</div>
                  </div>
                )}
                {sections.topTalkers && (
                  <div className="text-center">
                    <div className="text-2xl font-semibold">45</div>
                    <div className="text-sm text-muted-foreground">Hôtes Actifs</div>
                  </div>
                )}
                {sections.modelMetrics && (
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-green-600">94.7%</div>
                    <div className="text-sm text-muted-foreground">Précision du Modèle</div>
                  </div>
                )}
              </div>
              
              <div className="text-center text-muted-foreground text-sm pt-4 border-t">
                Le rapport complet sera généré au format PDF avec graphiques et analyses détaillées.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}