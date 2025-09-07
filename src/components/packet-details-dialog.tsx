import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SeverityBadge } from "./ui/severity-badge";
import { StatusBadge } from "./ui/status-badge";
import { Separator } from "./ui/separator";
import { 
  Network, 
  Clock, 
  Database, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Lock
} from "lucide-react";
import { NetworkPacket } from "../lib/packet-capture-service";

interface PacketDetailsDialogProps {
  packet: NetworkPacket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PacketDetailsDialog({ packet, open, onOpenChange }: PacketDetailsDialogProps) {
  if (!packet) return null;

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getAnomalyRisk = (score: number) => {
    if (score >= 0.9) return { level: 'Très élevé', color: 'text-red-600' };
    if (score >= 0.7) return { level: 'Élevé', color: 'text-orange-600' };
    if (score >= 0.5) return { level: 'Modéré', color: 'text-yellow-600' };
    if (score >= 0.3) return { level: 'Faible', color: 'text-blue-600' };
    return { level: 'Très faible', color: 'text-green-600' };
  };

  const anomalyRisk = getAnomalyRisk(packet.anomaly_score);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Détails du Paquet - Analyse Complète
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Informations Temporelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ID Paquet:</span>
                  <span className="font-mono text-sm">{packet.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Horodatage:</span>
                  <span className="font-mono text-sm">{formatTimestamp(packet.timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Durée:</span>
                  <span className="font-mono text-sm">{packet.features.duration.toFixed(2)} ms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Évaluation Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Prédiction IA:</span>
                  <StatusBadge status={packet.prediction === "Normal" ? "normal" : "attack"} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Score Anomalie:</span>
                  <span className={`font-medium ${anomalyRisk.color}`}>
                    {(packet.anomaly_score * 100).toFixed(2)}% ({anomalyRisk.level})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Niveau Menace:</span>
                  <SeverityBadge severity={packet.threat_level.toLowerCase() as any} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Network Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-4 w-4" />
                Informations Réseau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Source</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Adresse IP:</span>
                      <span className="font-mono text-sm">{packet.sourceIp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Port:</span>
                      <span className="font-mono text-sm">{packet.sourcePort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Octets envoyés:</span>
                      <span className="font-mono text-sm">{packet.features.src_bytes.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Destination</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Adresse IP:</span>
                      <span className="font-mono text-sm">{packet.destinationIp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Port:</span>
                      <span className="font-mono text-sm">{packet.destinationPort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Octets reçus:</span>
                      <span className="font-mono text-sm">{packet.features.dst_bytes.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Protocole</div>
                  <Badge variant="outline" className="mt-1">{packet.protocol}</Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Taille</div>
                  <div className="font-mono text-sm mt-1">{packet.size} octets</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Drapeaux</div>
                  <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {packet.flags.map((flag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">{flag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Charge utile</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {packet.payloadPreview}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RandomForest Features */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Caractéristiques du Modèle RandomForest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Connection Features */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Connexion
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connexions:</span>
                      <span className="font-mono">{packet.features.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Même service:</span>
                      <span className="font-mono">{packet.features.srv_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux erreur service:</span>
                      <span className="font-mono">{(packet.features.serror_rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux même service:</span>
                      <span className="font-mono">{(packet.features.same_srv_rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux service diff:</span>
                      <span className="font-mono">{(packet.features.diff_srv_rate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Security Features */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Sécurité
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connexions échouées:</span>
                      <span className="font-mono">{packet.features.num_failed_logins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connecté:</span>
                      <span className="font-mono">{packet.features.logged_in ? 'Oui' : 'Non'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Compromis:</span>
                      <span className="font-mono">{packet.features.num_compromised}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Root shell:</span>
                      <span className="font-mono">{packet.features.root_shell}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tentatives su:</span>
                      <span className="font-mono">{packet.features.su_attempted}</span>
                    </div>
                  </div>
                </div>

                {/* Host Features */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Hôte de Destination
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connexions hôte:</span>
                      <span className="font-mono">{packet.features.dst_host_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Services hôte:</span>
                      <span className="font-mono">{packet.features.dst_host_srv_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux même service hôte:</span>
                      <span className="font-mono">{(packet.features.dst_host_same_srv_rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux erreur hôte:</span>
                      <span className="font-mono">{(packet.features.dst_host_serror_rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux REJ hôte:</span>
                      <span className="font-mono">{(packet.features.dst_host_rerror_rate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Additional Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground">Land</div>
                  <div className="font-mono mt-1">{packet.features.land}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Fragment erroné</div>
                  <div className="font-mono mt-1">{packet.features.wrong_fragment}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Urgent</div>
                  <div className="font-mono mt-1">{packet.features.urgent}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Hot</div>
                  <div className="font-mono mt-1">{packet.features.hot}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Analysis */}
          {packet.prediction === 'Anomalie' && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Analyse d'Anomalie Détectée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ce paquet a été classifié comme anormal par le modèle RandomForest avec un score de confiance de{' '}
                    <span className="font-medium text-destructive">
                      {(packet.anomaly_score * 100).toFixed(2)}%
                    </span>.
                  </p>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium">Indicateurs de risque potentiels :</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {packet.features.serror_rate > 0.5 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-destructive rounded-full" />
                          <span>Taux d'erreur service élevé ({(packet.features.serror_rate * 100).toFixed(1)}%)</span>
                        </div>
                      )}
                      {packet.features.count > 200 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-destructive rounded-full" />
                          <span>Nombre de connexions suspect ({packet.features.count})</span>
                        </div>
                      )}
                      {packet.features.num_failed_logins > 5 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-destructive rounded-full" />
                          <span>Tentatives de connexion échouées ({packet.features.num_failed_logins})</span>
                        </div>
                      )}
                      {packet.features.root_shell > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-destructive rounded-full" />
                          <span>Accès root détecté</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}