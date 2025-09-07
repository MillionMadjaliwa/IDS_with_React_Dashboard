import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { 
  Search, 
  Download, 
  Filter,
  ArrowRight,
  Clock,
  Activity,
  FileText
} from "lucide-react";
import { generateTrafficData } from "../../lib/mock-data";

export function ForensicsPage() {
  const [groupBy, setGroupBy] = useState("conversation");
  const [trafficData] = useState(() => generateTrafficData(50));

  // Group data by conversation (src-dst pairs)
  const conversations = trafficData.reduce((acc, traffic) => {
    const key = `${traffic.srcIp}-${traffic.dstIp}`;
    if (!acc[key]) {
      acc[key] = {
        srcIp: traffic.srcIp,
        srcHost: traffic.srcHost,
        dstIp: traffic.dstIp,
        dstHost: traffic.dstHost,
        events: [],
        totalBytes: 0,
        protocols: new Set(),
        services: new Set(),
        riskScore: 0,
      };
    }
    acc[key].events.push(traffic);
    acc[key].totalBytes += traffic.bytesIn + traffic.bytesOut;
    acc[key].protocols.add(traffic.protocol);
    acc[key].services.add(traffic.service);
    acc[key].riskScore = Math.max(acc[key].riskScore, traffic.riskScore);
    return acc;
  }, {} as any);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Investigation</h1>
          <p className="text-muted-foreground">
            Analyse forensique et chronologie des événements
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Grouper par:</span>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversation">Conversation</SelectItem>
                  <SelectItem value="srcip">IP Source</SelectItem>
                  <SelectItem value="dstip">IP Destination</SelectItem>
                  <SelectItem value="protocol">Protocole</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Filtrer par sous-réseau:</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout</SelectItem>
                  <SelectItem value="internal">Interne</SelectItem>
                  <SelectItem value="external">Externe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Vue Chronologique - Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.values(conversations).map((conv: any, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 font-mono text-sm">
                          <span>{conv.srcHost || conv.srcIp}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{conv.dstHost || conv.dstIp}</span>
                        </div>
                        <div className="w-12 h-2 bg-muted rounded-full">
                          <div
                            className={`h-2 rounded-full ${
                              conv.riskScore > 80 ? 'bg-red-500' : 
                              conv.riskScore > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${conv.riskScore}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {conv.events.length} événements
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>{(conv.totalBytes / 1024).toFixed(1)} KB</span>
                      <div className="flex gap-1">
                        {Array.from(conv.protocols).map((protocol: any) => (
                          <Badge key={protocol} variant="outline" className="text-xs">
                            {protocol}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        {Array.from(conv.services).map((service: any) => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {conv.events.slice(0, 3).map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between text-xs">
                          <span className="font-mono text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString('fr-FR')}
                          </span>
                          <span>{event.bytesIn + event.bytesOut} octets</span>
                          <span>{event.protocol}/{event.service}</span>
                        </div>
                      ))}
                      {conv.events.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center pt-1">
                          +{conv.events.length - 3} événements de plus
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Statistiques en Temps Réel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Flux/seconde</span>
                  <span className="font-mono">12.5</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "62%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Octets/seconde</span>
                  <span className="font-mono">1.2 MB</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "45%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Top services</span>
                </div>
                <div className="space-y-1 mt-2">
                  {[
                    { name: "HTTPS", count: 145 },
                    { name: "HTTP", count: 89 },
                    { name: "DNS", count: 67 },
                    { name: "SSH", count: 23 },
                  ].map((service) => (
                    <div key={service.name} className="flex justify-between text-xs">
                      <span>{service.name}</span>
                      <span className="font-mono">{service.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contrôles de Tableau Croisé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Grouper par</label>
                <Select defaultValue="srcip">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="srcip">IP Source</SelectItem>
                    <SelectItem value="dstip">IP Destination</SelectItem>
                    <SelectItem value="protocol">Protocole</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Filtrer par sous-réseau</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="192.168.156.0/24">192.168.156.0/24</SelectItem>
                    <SelectItem value="external">Externe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="w-full">
                Appliquer les Filtres
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}