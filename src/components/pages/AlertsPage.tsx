import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { SeverityBadge } from "../ui/severity-badge";
import { StatusBadge } from "../ui/status-badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Separator } from "../ui/separator";
import { 
  AlertTriangle, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Clock,
  Shield,
  ArrowRight,
  Activity
} from "lucide-react";
import { generateAlerts, Alert } from "../../lib/mock-data";

export function AlertsPage() {
  const [alerts] = useState(() => generateAlerts(100));
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    if (timeFilter !== "all") {
      const now = new Date();
      const alertTime = new Date(alert.created);
      const diffHours = (now.getTime() - alertTime.getTime()) / (1000 * 60 * 60);
      
      switch (timeFilter) {
        case "1h":
          if (diffHours > 1) return false;
          break;
        case "6h":
          if (diffHours > 6) return false;
          break;
        case "24h":
          if (diffHours > 24) return false;
          break;
      }
    }
    return true;
  });

  const updateAlertStatus = (alertId: string, status: Alert['status']) => {
    // In a real app, this would make an API call
    console.log(`Updating alert ${alertId} status to ${status}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Alertes</h1>
          <p className="text-muted-foreground">
            Gestion et triage des alertes de sécurité
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredAlerts.length} alertes
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtres:</span>
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sévérités</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="informational">Informationnelle</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="acknowledged">Acquitté</SelectItem>
                <SelectItem value="suppressed">Supprimé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute période</SelectItem>
                <SelectItem value="1h">1 dernière heure</SelectItem>
                <SelectItem value="6h">6 dernières heures</SelectItem>
                <SelectItem value="24h">24 dernières heures</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes de Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune alerte trouvée pour les critères sélectionnés</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Créée</TableHead>
                    <TableHead>Source → Destination</TableHead>
                    <TableHead>Protocole/Service</TableHead>
                    <TableHead>Libellé du Modèle</TableHead>
                    <TableHead>Probabilité</TableHead>
                    <TableHead>Score de Risque</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(alert.created).toLocaleDateString('fr-FR', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={alert.severity} />
                          <div>
                            <div className="flex items-center gap-1 font-mono text-sm">
                              <span>{alert.srcIp}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>{alert.dstIp}</span>
                            </div>
                            {alert.srcPort && alert.dstPort && (
                              <div className="text-xs text-muted-foreground">
                                :{alert.srcPort} → :{alert.dstPort}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">{alert.protocol}</Badge>
                          <div className="text-xs text-muted-foreground mt-1">{alert.service}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{alert.modelLabel}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-muted rounded-full">
                            <div
                              className="h-2 bg-red-500 rounded-full"
                              style={{ width: `${alert.probability * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono">
                            {(alert.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-muted rounded-full">
                            <div
                              className={`h-2 rounded-full ${
                                alert.riskScore > 80 ? 'bg-red-500' : 
                                alert.riskScore > 60 ? 'bg-yellow-500' : 
                                alert.riskScore > 40 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${alert.riskScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono">{alert.riskScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={alert.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedAlert(alert)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[500px] sm:w-[540px]">
                              {selectedAlert && (
                                <>
                                  <SheetHeader>
                                    <div className="flex items-center gap-2">
                                      <SeverityBadge severity={selectedAlert.severity} />
                                      <StatusBadge status={selectedAlert.status} />
                                    </div>
                                    <SheetTitle>{selectedAlert.modelLabel}</SheetTitle>
                                    <SheetDescription>
                                      Alerte détectée le {new Date(selectedAlert.created).toLocaleString('fr-FR')}
                                    </SheetDescription>
                                  </SheetHeader>

                                  <div className="mt-6 space-y-6">
                                    {/* Core Information */}
                                    <div>
                                      <h3 className="font-semibold mb-3">Informations Principales</h3>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">IP Source:</span>
                                          <p className="font-mono">{selectedAlert.srcIp}:{selectedAlert.srcPort}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">IP Destination:</span>
                                          <p className="font-mono">{selectedAlert.dstIp}:{selectedAlert.dstPort}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Protocole:</span>
                                          <p>{selectedAlert.protocol}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Service:</span>
                                          <p>{selectedAlert.service}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Nombre de paquets:</span>
                                          <p>{selectedAlert.packetCount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Score de risque:</span>
                                          <p>{selectedAlert.riskScore}/100</p>
                                        </div>
                                      </div>
                                    </div>

                                    <Separator />

                                    {/* Model Inference */}
                                    <div>
                                      <h3 className="font-semibold mb-3">Inférence du Modèle RandomForest</h3>
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-muted-foreground">Probabilité d'attaque:</span>
                                          <div className="flex items-center gap-2 mt-1">
                                            <div className="w-full h-3 bg-muted rounded-full">
                                              <div
                                                className="h-3 bg-red-500 rounded-full"
                                                style={{ width: `${selectedAlert.probability * 100}%` }}
                                              />
                                            </div>
                                            <span className="font-mono text-sm">
                                              {(selectedAlert.probability * 100).toFixed(2)}%
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {selectedAlert.featureVector && (
                                          <div>
                                            <span className="text-muted-foreground">Top 5 caractéristiques:</span>
                                            <div className="mt-2 space-y-1">
                                              {Object.entries(selectedAlert.featureVector).slice(0, 5).map(([feature, value]) => (
                                                <div key={feature} className="flex justify-between text-sm">
                                                  <span className="text-muted-foreground">{feature}:</span>
                                                  <span className="font-mono">{value.toFixed(3)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <Separator />

                                    {/* Actions */}
                                    <div>
                                      <h3 className="font-semibold mb-3">Actions de Triage</h3>
                                      <div className="space-y-2">
                                        <Button 
                                          variant="outline" 
                                          className="w-full justify-start"
                                          onClick={() => updateAlertStatus(selectedAlert.id, "acknowledged")}
                                        >
                                          <Check className="h-4 w-4 mr-2" />
                                          Acquitter cette alerte
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          className="w-full justify-start"
                                        >
                                          <Activity className="h-4 w-4 mr-2" />
                                          Créer un dossier d'enquête
                                        </Button>
                                        <div className="flex gap-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => updateAlertStatus(selectedAlert.id, "suppressed")}
                                          >
                                            <X className="h-4 w-4 mr-1" />
                                            Supprimer 1h
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => updateAlertStatus(selectedAlert.id, "suppressed")}
                                          >
                                            <Clock className="h-4 w-4 mr-1" />
                                            Supprimer 24h
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    <Separator />

                                    {/* Timeline Preview */}
                                    <div>
                                      <h3 className="font-semibold mb-3">Aperçu de la Chronologie</h3>
                                      <div className="bg-muted/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Activity className="h-4 w-4" />
                                          <span>Chronologie du trafic disponible dans la section Investigation</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </SheetContent>
                          </Sheet>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateAlertStatus(alert.id, "acknowledged")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateAlertStatus(alert.id, "suppressed")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}