import { useWebSocketStatus } from "../../hooks/WebSocketProvider";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { KpiTile } from "../ui/kpi-tile";
import { SeverityBadge } from "../ui/severity-badge";
import { StatusBadge } from "../ui/status-badge";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Activity, 
  Shield, 
  Users, 
  Server, 
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Clock
} from "lucide-react";
import { generateTrafficData, generateAlerts, generateRealtimeMetrics, modelInfo } from "../../lib/mock-data";
import { useState, useEffect } from "react";

export function OverviewPage() {
  const { isConnected, connectionStatus, reconnect } = useWebSocketStatus();
  const [metrics, setMetrics] = useState(generateRealtimeMetrics());
  const [trafficData] = useState(() => generateTrafficData(10));
  const [recentAlerts] = useState(() => generateAlerts(8));
  const [deltaValues, setDeltaValues] = useState({
    packets: { value: Math.floor(Math.random() * 1000) - 500, type: Math.random() > 0.5 ? "increase" : "decrease" as const },
    srcIps: { value: Math.floor(Math.random() * 10) - 5, type: Math.random() > 0.5 ? "increase" : "decrease" as const },
    dstIps: { value: Math.floor(Math.random() * 15) - 7, type: Math.random() > 0.5 ? "increase" : "decrease" as const },
    services: { value: Math.floor(Math.random() * 5) - 2, type: Math.random() > 0.5 ? "increase" : "neutral" as const }
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateRealtimeMetrics());
      // Update delta values less frequently to avoid DOM conflicts
      setDeltaValues({
        packets: { value: Math.floor(Math.random() * 1000) - 500, type: Math.random() > 0.5 ? "increase" : "decrease" as const },
        srcIps: { value: Math.floor(Math.random() * 10) - 5, type: Math.random() > 0.5 ? "increase" : "decrease" as const },
        dstIps: { value: Math.floor(Math.random() * 15) - 7, type: Math.random() > 0.5 ? "increase" : "decrease" as const },
        services: { value: Math.floor(Math.random() * 5) - 2, type: Math.random() > 0.5 ? "increase" : "neutral" as const }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate severity breakdown
  const severityBreakdown = recentAlerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate top talkers
  const topTalkers = trafficData
    .reduce((acc, traffic) => {
      const existing = acc.find(t => t.srcIp === traffic.srcIp);
      if (existing) {
        existing.bytesOut += traffic.bytesOut;
        existing.bytesIn += traffic.bytesIn;
        existing.flows += traffic.flows;
      } else {
        acc.push({
          srcIp: traffic.srcIp,
          srcHost: traffic.srcHost,
          bytesOut: traffic.bytesOut,
          bytesIn: traffic.bytesIn,
          flows: traffic.flows,
          riskScore: traffic.riskScore
        });
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => b.bytesOut - a.bytesOut)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Connexion Python Service Status & Reconnect */}
      <div className="flex items-center gap-4 mb-2">
        <span className={isConnected ? "text-green-600" : "text-red-600"}>
          {isConnected ? "Service Python connecté" : "Service Python déconnecté"}
        </span>
        {!isConnected && (
          <button
            onClick={reconnect}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
          >
            Reconnecter le service Python
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vue d'ensemble</h1>
          <p className="text-muted-foreground">
            Surveillance en temps réel de votre réseau local
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">Mise à jour automatique</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          title="Paquets/min"
          value={metrics.packetsPerMinute.toLocaleString()}
          delta={{
            value: deltaValues.packets.value,
            type: deltaValues.packets.type,
            label: "vs dernière heure"
          }}
          sparkline={metrics.packetsPerSecond.slice(-15)}
        />
        <KpiTile
          title="IP Sources Uniques"
          value={metrics.uniqueSrcIps}
          delta={{
            value: deltaValues.srcIps.value,
            type: deltaValues.srcIps.type,
            label: "vs dernière heure"
          }}
        />
        <KpiTile
          title="IP Destinations Uniques"
          value={metrics.uniqueDstIps}
          delta={{
            value: deltaValues.dstIps.value,
            type: deltaValues.dstIps.type,
            label: "vs dernière heure"
          }}
        />
        <KpiTile
          title="Services Actifs"
          value={metrics.activeServices}
          delta={{
            value: deltaValues.services.value,
            type: deltaValues.services.type,
            label: "vs dernière heure"
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Severity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Répartition des Alertes par Sévérité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(severityBreakdown).map(([severity, count]) => {
                const maxCount = Math.max(...Object.values(severityBreakdown) as number[], 1);
                const percentage = ((count as number) / maxCount) * 100;
                
                return (
                  <div key={`severity-${severity}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={severity as any} />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{count} alertes</span>
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.max(0, Math.min(100, percentage))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(severityBreakdown).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune alerte pour le moment — Surveillance de votre réseau local. Restez vigilant.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Model Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Santé du Modèle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Modèle</span>
                <Badge variant="outline">{modelInfo.name} (lecture seule)</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Précision</p>
                  <p className="text-lg font-semibold">{(modelInfo.metrics.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rappel</p>
                  <p className="text-lg font-semibold">{(modelInfo.metrics.recall * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">F1-Score</p>
                  <p className="text-lg font-semibold">{modelInfo.metrics.f1.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROC AUC</p>
                  <p className="text-lg font-semibold">{modelInfo.metrics.rocAuc.toFixed(3)}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Dernière formation: {new Date(modelInfo.lastRetrain).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Talkers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Communicants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTalkers.map((talker, index) => (
                <div key={`${talker.srcIp}-${index}`} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{talker.srcHost || talker.srcIp}</p>
                      {talker.srcHost && <p className="text-sm text-muted-foreground">{talker.srcIp}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4 text-sm">
                      <span>{(talker.bytesOut / 1024).toFixed(1)} KB ↑</span>
                      <span>{(talker.bytesIn / 1024).toFixed(1)} KB ↓</span>
                      <span>{talker.flows} flux</span>
                      <div className="w-12">
                        <div className={`w-full h-2 rounded-full ${
                          talker.riskScore > 80 ? 'bg-red-200' : 
                          talker.riskScore > 60 ? 'bg-yellow-200' : 'bg-green-200'
                        }`}>
                          <div
                            className={`h-2 rounded-full ${
                              talker.riskScore > 80 ? 'bg-red-500' : 
                              talker.riskScore > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${talker.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertes Récentes
              </div>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.slice(0, 5).map((alert, idx) => (
                <div key={alert.id + '-' + idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={alert.severity} />
                    <div>
                      <p className="text-sm font-medium">{alert.modelLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.srcIp} → {alert.dstIp} ({alert.service})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={alert.status} />
                      <span className="text-sm text-muted-foreground">
                        {(alert.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
              {recentAlerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune alerte récente — Réseau sécurisé</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}