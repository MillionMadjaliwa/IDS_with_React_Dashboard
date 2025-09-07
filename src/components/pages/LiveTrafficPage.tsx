import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { SeverityBadge } from "../ui/severity-badge";
import { StatusBadge } from "../ui/status-badge";
import { 
  Activity, 
  RefreshCw, 
  Filter, 
  Download,
  TrendingUp,
  BarChart3,
  Shield,
  Play,
  Pause,
  Trash2,
  Network
} from "lucide-react";
import { useRealPacketCapture } from "../../hooks/use-real-packet-capture";
import { PacketDetailsDialog } from "../packet-details-dialog";
import { ConnectionPanel } from "../connection-panel";
import { NetworkPacket } from "../../lib/real-packet-capture-service";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function LiveTrafficPage() {
  const { 
    packets, 
    interfaces,
    stats, 
    connectionStatus,
    isCapturing,
    isConnected,
    usingFallback,
    connect,
    connectToPython,
    disconnect,
    startCapture,
    stopCapture,
    clearPackets,
    getPacketsByProtocol,
    getAnomalousPackets 
  } = useRealPacketCapture(1000, { autoConnect: false }); // Pas de connexion auto

  const [timeRange, setTimeRange] = useState("5m");
  const [protocolFilter, setProtocolFilter] = useState("all");
  const [threatFilter, setThreatFilter] = useState("all");
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);
  const [showPacketDetails, setShowPacketDetails] = useState(false);

  // Filter packets
  const filteredPackets = packets.filter(packet => {
    if (protocolFilter !== "all" && packet.protocol !== protocolFilter) return false;
    if (threatFilter !== "all" && packet.threat_level !== threatFilter) return false;
    return true;
  });

  // Chart data preparation
  const [packetsHistory, setPacketsHistory] = useState<Array<{time: string, packets: number}>>([]);

  // Update packets history for the chart
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      
      setPacketsHistory(prev => {
        const newHistory = [...prev, { time: currentTime, packets: stats.packetsPerSecond }];
        return newHistory.slice(-60); // Keep last 60 seconds
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stats.packetsPerSecond]);

  const protocolChartData = Object.entries(stats.protocolDistribution).map(([protocol, count]) => {
    const total = Object.values(stats.protocolDistribution).reduce((a, b) => a + b, 0);
    return {
      protocol,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0"
    };
  });

  const threatChartData = Object.entries(stats.threatLevelDistribution).map(([level, count]) => {
    const total = Object.values(stats.threatLevelDistribution).reduce((a, b) => a + b, 0);
    return {
      level,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0"
    };
  });

  const colors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Capture de Paquets en Temps Réel</h1>
          <p className="text-muted-foreground">
            {usingFallback 
              ? 'Mode simulation avec données réalistes - Toutes les fonctionnalités disponibles'
              : 'Surveillance et analyse en temps réel avec modèle RandomForest Python'
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            <span className="text-sm font-medium">
              {filteredPackets.length} paquets affichés
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 
                (usingFallback ? 'bg-warning animate-pulse' : 
                 isCapturing ? 'bg-success animate-pulse' : 'bg-success') : 
                'bg-destructive'
            }`} />
            <span className="text-sm text-muted-foreground">
              {!isConnected ? 'Initialisation...' : 
               usingFallback ? 'Mode simulation' :
               isCapturing ? 'Capture Python active' : 'Service Python prêt'}
            </span>
          </div>
        </div>
      </div>

      {/* Connection and Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ConnectionPanel
            connectionStatus={connectionStatus}
            isConnected={isConnected}
            interfaces={interfaces}
            onConnect={connect}
            onConnectToPython={connectToPython}
            onDisconnect={disconnect}
            onStartCapture={startCapture}
            onStopCapture={stopCapture}
            isCapturing={isCapturing}
            usingFallback={usingFallback}
          />
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Stats Display */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{stats.totalPackets.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Par seconde:</span>
                    <span className="font-medium">{stats.packetsPerSecond}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Anomalies:</span>
                    <span className="font-medium text-destructive">{stats.anomaliesDetected}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Score moyen:</span>
                    <span className="font-medium">{(stats.averageAnomalyScore * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 ml-auto">
                  <Filter className="h-4 w-4" />
                  <Select value={protocolFilter} onValueChange={setProtocolFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Protocole" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous protocoles</SelectItem>
                      <SelectItem value="TCP">TCP</SelectItem>
                      <SelectItem value="UDP">UDP</SelectItem>
                      <SelectItem value="HTTP">HTTP</SelectItem>
                      <SelectItem value="HTTPS">HTTPS</SelectItem>
                      <SelectItem value="DNS">DNS</SelectItem>
                      <SelectItem value="SSH">SSH</SelectItem>
                      <SelectItem value="FTP">FTP</SelectItem>
                      <SelectItem value="ICMP">ICMP</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={threatFilter} onValueChange={setThreatFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Menace" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous niveaux</SelectItem>
                      <SelectItem value="Informationnel">Informationnel</SelectItem>
                      <SelectItem value="Faible">Faible</SelectItem>
                      <SelectItem value="Moyen">Moyen</SelectItem>
                      <SelectItem value="Élevé">Élevé</SelectItem>
                      <SelectItem value="Critique">Critique</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={clearPackets} 
                    variant="outline" 
                    size="sm"
                    disabled={packets.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Vider
                  </Button>

                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter PCAP
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Traffic */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Débit en Temps Réel (paquets/sec)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={packetsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis 
                  dataKey="time" 
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(label) => `Heure: ${label}`}
                  formatter={(value: any) => [`${value}`, 'Paquets/sec']}
                />
                <Line 
                  type="monotone" 
                  dataKey="packets" 
                  stroke="var(--chart-1)" 
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Protocol Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Distribution Protocoles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={protocolChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="protocol" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value: any, name, props) => [
                  `${value} (${props.payload.percentage}%)`, 
                  'Paquets'
                ]} />
                <Bar dataKey="count" fill="var(--chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Threat Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Niveaux de Menace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={threatChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {threatChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name, props) => [
                  `${value} (${props.payload.percentage}%)`, 
                  props.payload.level
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Packet Capture Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Capture de Paquets - Analyse RandomForest
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPackets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {filteredPackets.length === 0 
                  ? (usingFallback 
                      ? "Génération de paquets simulés en cours..." 
                      : !isConnected 
                        ? "Initialisation du service..." 
                        : isCapturing 
                          ? "En attente des paquets réseau..."
                          : "Capture arrêtée")
                  : `${filteredPackets.length} paquets capturés`}
              </p>
              <p className="text-sm mt-1">
                {usingFallback
                  ? "Mode simulation avec données réalistes - Toutes les fonctionnalités disponibles"
                  : !isConnected 
                    ? "Le service va démarrer automatiquement" 
                    : isCapturing 
                      ? "Paquets analysés en temps réel avec le modèle RandomForest Python" 
                      : "Cliquez sur 'Démarrer la Capture' pour commencer"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Horodatage</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Protocole</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Drapeaux</TableHead>
                    <TableHead>Charge Utile</TableHead>
                    <TableHead>Prédiction IA</TableHead>
                    <TableHead>Score Anomalie</TableHead>
                    <TableHead>Niveau Menace</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackets.slice(0, 200).map((packet) => (
                    <TableRow 
                      key={packet.id} 
                      className={`cursor-pointer hover:bg-muted/50 ${
                        packet.prediction === 'Anomalie' ? 'bg-destructive/5' : ''
                      }`}
                      onClick={() => {
                        setSelectedPacket(packet);
                        setShowPacketDetails(true);
                      }}
                    >
                      <TableCell className="font-mono text-xs">
                        {packet.timestamp.toLocaleTimeString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-mono text-xs">{packet.sourceIp}</span>
                          <div className="text-xs text-muted-foreground">:{packet.sourcePort}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-mono text-xs">{packet.destinationIp}</span>
                          <div className="text-xs text-muted-foreground">:{packet.destinationPort}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{packet.protocol}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {packet.size.toLocaleString()} B
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {packet.flags.map((flag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate text-xs text-muted-foreground">
                          {packet.payloadPreview}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={packet.prediction === "Normal" ? "normal" : "attack"} 
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <span className={
                          packet.anomaly_score > 0.7 ? 'text-destructive font-medium' : ''
                        }>
                          {(packet.anomaly_score * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <SeverityBadge 
                          severity={packet.threat_level.toLowerCase() as any} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Packet Details Dialog */}
      <PacketDetailsDialog
        packet={selectedPacket}
        open={showPacketDetails}
        onOpenChange={setShowPacketDetails}
      />
    </div>
  );
}