import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { 
  Server, 
  Monitor, 
  AlertTriangle,
  TrendingUp,
  Shield,
  Eye,
  Star,
  Clock
} from "lucide-react";
import { generateHosts, Host } from "../../lib/mock-data";

export function AssetsPage() {
  const [hosts] = useState(() => generateHosts(50));
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);

  const toggleCriticalAsset = (hostId: string) => {
    // In a real app, this would make an API call
    console.log(`Toggling critical asset status for host ${hostId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Actifs & Hôtes</h1>
          <p className="text-muted-foreground">
            Inventaire des équipements du réseau local
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {hosts.length} hôtes découverts
          </span>
        </div>
      </div>

      {/* Hosts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Inventaire des Hôtes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nom d'hôte</TableHead>
                  <TableHead>Adresse IP</TableHead>
                  <TableHead>Adresse MAC</TableHead>
                  <TableHead>Système d'exploitation</TableHead>
                  <TableHead>Premier vu</TableHead>
                  <TableHead>Dernier vu</TableHead>
                  <TableHead>Services ouverts</TableHead>
                  <TableHead>Alertes</TableHead>
                  <TableHead>Tendance de risque</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hosts.map((host) => (
                  <TableRow key={host.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {host.isCritical && <Star className="h-4 w-4 text-yellow-500" />}
                        <span className="font-medium">{host.hostname}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{host.ip}</TableCell>
                    <TableCell className="font-mono text-sm">{host.mac}</TableCell>
                    <TableCell>
                      {host.os ? (
                        <Badge variant="secondary">{host.os}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Inconnu</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(host.firstSeen).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(host.lastSeen).toLocaleTimeString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {host.openServices.map((service) => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`${host.alertCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {host.alertCount}
                        </span>
                        {host.alertCount > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-end gap-px h-6">
                          {host.riskTrend.slice(-8).map((point, index) => (
                            <div
                              key={index}
                              className={`w-1 ${
                                point > 70 ? 'bg-red-400' : 
                                point > 40 ? 'bg-yellow-400' : 'bg-green-400'
                              }`}
                              style={{
                                height: `${Math.max(2, (point / 100) * 24)}px`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedHost(host)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[600px] sm:w-[700px]">
                            {selectedHost && (
                              <>
                                <SheetHeader>
                                  <div className="flex items-center gap-2">
                                    <Monitor className="h-5 w-5" />
                                    {selectedHost.isCritical && <Star className="h-4 w-4 text-yellow-500" />}
                                  </div>
                                  <SheetTitle>{selectedHost.hostname}</SheetTitle>
                                  <SheetDescription>
                                    {selectedHost.ip} • {selectedHost.mac}
                                  </SheetDescription>
                                </SheetHeader>

                                <div className="mt-6">
                                  <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4">
                                      <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                                      <TabsTrigger value="traffic">Trafic</TabsTrigger>
                                      <TabsTrigger value="alerts">Alertes</TabsTrigger>
                                      <TabsTrigger value="notes">Notes</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="overview" className="mt-4 space-y-4">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-base">Informations de l'hôte</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <span className="text-muted-foreground">Nom d'hôte:</span>
                                              <p className="font-medium">{selectedHost.hostname}</p>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Adresse IP:</span>
                                              <p className="font-mono">{selectedHost.ip}</p>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Adresse MAC:</span>
                                              <p className="font-mono">{selectedHost.mac}</p>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">OS:</span>
                                              <p>{selectedHost.os || "Inconnu"}</p>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Premier vu:</span>
                                              <p className="font-mono text-xs">
                                                {new Date(selectedHost.firstSeen).toLocaleDateString('fr-FR')}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Dernier vu:</span>
                                              <p className="font-mono text-xs">
                                                {new Date(selectedHost.lastSeen).toLocaleString('fr-FR')}
                                              </p>
                                            </div>
                                          </div>

                                          <div>
                                            <span className="text-muted-foreground">Services ouverts:</span>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {selectedHost.openServices.map((service) => (
                                                <Badge key={service} variant="secondary">
                                                  {service}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>

                                          <div>
                                            <span className="text-muted-foreground">Tendance de risque (24h):</span>
                                            <div className="flex items-end gap-px h-16 mt-2 bg-muted/30 rounded p-2">
                                              {selectedHost.riskTrend.map((point, index) => (
                                                <div
                                                  key={index}
                                                  className={`w-2 ${
                                                    point > 70 ? 'bg-red-500' : 
                                                    point > 40 ? 'bg-yellow-500' : 'bg-green-500'
                                                  }`}
                                                  style={{
                                                    height: `${Math.max(4, (point / 100) * 48)}px`,
                                                  }}
                                                />
                                              ))}
                                            </div>
                                          </div>

                                          <div className="pt-2 border-t">
                                            <Button
                                              variant={selectedHost.isCritical ? "default" : "outline"}
                                              size="sm"
                                              onClick={() => toggleCriticalAsset(selectedHost.id)}
                                              className="w-full"
                                            >
                                              <Star className="h-4 w-4 mr-2" />
                                              {selectedHost.isCritical ? 
                                                "Retirer du statut d'actif critique" : 
                                                "Marquer comme actif critique"
                                              }
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>

                                    <TabsContent value="traffic" className="mt-4">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-base">Trafic réseau</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="text-center py-8 text-muted-foreground">
                                            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>Données de trafic pour cet hôte</p>
                                            <p className="text-sm mt-1">Disponible dans la vue Trafic en direct</p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>

                                    <TabsContent value="alerts" className="mt-4">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-base">Alertes associées</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="text-center py-8 text-muted-foreground">
                                            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>{selectedHost.alertCount} alertes pour cet hôte</p>
                                            <p className="text-sm mt-1">Consultez la section Alertes pour plus de détails</p>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>

                                    <TabsContent value="notes" className="mt-4">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-base">Notes d'investigation</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="text-center py-8 text-muted-foreground">
                                            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>Aucune note pour cet hôte</p>
                                            <Button variant="outline" size="sm" className="mt-2">
                                              Ajouter une note
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </>
                            )}
                          </SheetContent>
                        </Sheet>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}