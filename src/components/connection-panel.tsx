import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Network,
  Zap
} from "lucide-react";

interface ConnectionPanelProps {
  connectionStatus: string;
  isConnected: boolean;
  interfaces: Array<{name: string, ip: string, status: string}>;
  onConnect: (url: string) => Promise<boolean>;
  onConnectToPython?: (url: string) => Promise<boolean>;
  onDisconnect: () => void;
  onStartCapture: (interfaceName?: string, filter?: string) => Promise<boolean>;
  onStopCapture: () => Promise<boolean>;
  isCapturing: boolean;
  usingFallback?: boolean;
}

export function ConnectionPanel({
  connectionStatus,
  isConnected,
  interfaces,
  onConnect,
  onConnectToPython,
  onDisconnect,
  onStartCapture,
  onStopCapture,
  isCapturing,
  usingFallback = false
}: ConnectionPanelProps) {
  const [wsUrl, setWsUrl] = useState('ws://localhost:8765');
  const [selectedInterface, setSelectedInterface] = useState<string>('auto');
  const [captureFilter, setCaptureFilter] = useState('net 192.168.0.0/16 or net 10.0.0.0/8');
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastError, setLastError] = useState<string>('');

  // Réinitialiser l'erreur quand la connexion change
  useEffect(() => {
    if (isConnected) {
      setLastError('');
    }
  }, [isConnected]);

  const handleConnectToPython = async () => {
    if (!onConnectToPython) return;
    
    setIsConnecting(true);
    setLastError('');
    
    try {
      const success = await onConnectToPython(wsUrl);
      if (success) {
        setLastError(''); // Connexion réussie au service Python
      } else {
        setLastError('Impossible de se connecter au service Python. Vérifiez que le service est démarré.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setLastError(`Erreur de connexion: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartCapture = async () => {
    try {
      // Convertir 'auto' vers undefined pour la détection automatique
      const interfaceToUse = selectedInterface === 'auto' ? undefined : selectedInterface;
      const success = await onStartCapture(interfaceToUse, captureFilter || undefined);
      if (!success) {
        setLastError('Impossible de démarrer la capture. Vérifiez les privilèges et l\'interface sélectionnée.');
      }
    } catch (error) {
      setLastError(`Erreur de capture: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleStopCapture = async () => {
    try {
      const success = await onStopCapture();
      if (!success) {
        setLastError('Impossible d\'arrêter la capture.');
      }
    } catch (error) {
      setLastError(`Erreur lors de l'arrêt: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'connecting':
        return <Loader2 className="h-5 w-5 text-warning animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <WifiOff className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    if (usingFallback && isConnected) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          Mode Simulation
        </Badge>
      );
    }

    const statusMap = {
      connected: { variant: 'default' as const, text: 'Connecté', color: 'bg-success' },
      connecting: { variant: 'secondary' as const, text: 'Connexion...', color: 'bg-warning' },
      error: { variant: 'destructive' as const, text: 'Erreur', color: 'bg-destructive' },
      disconnected: { variant: 'outline' as const, text: 'Déconnecté', color: 'bg-muted' }
    };
    
    const status = statusMap[connectionStatus as keyof typeof statusMap] || statusMap.disconnected;
    
    return (
      <Badge variant={status.variant} className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${status.color} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
        {status.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Panneau de Statut */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {usingFallback ? 'Mode Simulation' : 'Service Python'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {usingFallback ? 'Données simulées réalistes' : 'Capture réseau temps réel'}
              </p>
              {getStatusBadge()}
            </div>
          </div>

          {usingFallback && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Mode simulation actif. Toutes les fonctionnalités sont disponibles avec des données réalistes.
                  Pour utiliser la capture réseau réelle, connectez-vous au service Python ci-dessous.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="ws-url">URL du Service Python (optionnel)</Label>
                <Input
                  id="ws-url"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  placeholder="ws://localhost:8765"
                  disabled={isConnecting}
                />
              </div>
              
              <Button 
                onClick={handleConnectToPython}
                disabled={isConnecting || !wsUrl || !onConnectToPython}
                variant="outline"
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Basculer vers le Service Python
                  </>
                )}
              </Button>
            </div>
          )}

          {!usingFallback && isConnected && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Connecté au service Python. Capture réseau réelle active avec votre modèle RandomForest.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button 
                  onClick={onDisconnect}
                  variant="outline"
                  size="sm"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Revenir au Mode Simulation
                </Button>
              </div>
            </div>
          )}

          {lastError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{lastError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Panneau de Configuration de Capture */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration de Capture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Interfaces Réseau */}
            <div className="space-y-2">
              <Label>Interface Réseau</Label>
              <Select value={selectedInterface} onValueChange={setSelectedInterface}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une interface (auto si vide)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Détection automatique</SelectItem>
                  {interfaces.map((iface) => (
                    <SelectItem key={iface.name} value={iface.name}>
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        <span>{iface.name}</span>
                        <span className="text-muted-foreground">({iface.ip})</span>
                        <Badge 
                          variant={iface.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {iface.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {interfaces.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucune interface détectée. Le service Python doit être démarré avec des privilèges administrateur.
                </p>
              )}
            </div>

            {/* Filtre de Capture */}
            <div className="space-y-2">
              <Label htmlFor="capture-filter">Filtre de Capture (BPF)</Label>
              <Input
                id="capture-filter"
                value={captureFilter}
                onChange={(e) => setCaptureFilter(e.target.value)}
                placeholder="net 192.168.0.0/16 or net 10.0.0.0/8"
              />
              <p className="text-xs text-muted-foreground">
                Filtre Berkeley Packet Filter pour limiter les paquets capturés
              </p>
            </div>

            {/* Contrôles de Capture */}
            <div className="flex gap-2">
              {!isCapturing ? (
                <Button 
                  onClick={handleStartCapture}
                  className="flex-1"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Démarrer la Capture
                </Button>
              ) : (
                <Button 
                  onClick={handleStopCapture}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Arrêter la Capture
                </Button>
              )}
            </div>

            {isCapturing && (
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  {usingFallback 
                    ? 'Simulation en cours. Génération de paquets réseau réalistes avec analyse ML simulée.' 
                    : `Capture en cours${selectedInterface && selectedInterface !== 'auto' ? ` sur l'interface ${selectedInterface}` : ''}. Les paquets sont analysés en temps réel avec votre modèle RandomForest.`
                  }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions pour le service Python */}
      {usingFallback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Service Python (Optionnel)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <p className="font-medium">Pour activer la capture réseau réelle :</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Ouvrez un terminal et naviguez vers <code className="bg-muted px-1 rounded">python-backend/</code></li>
                <li>Installez les dépendances : <code className="bg-muted px-1 rounded">pip install -r requirements.txt</code></li>
                <li>Démarrez le service : <code className="bg-muted px-1 rounded">sudo python3 start_sentinel.py</code></li>
                <li>Utilisez le bouton ci-dessus pour vous connecter</li>
              </ol>
              
              <div className="bg-success/10 border border-success/20 p-3 rounded-lg mt-3">
                <p className="text-xs font-medium mb-1 text-success">✨ Mode simulation actif</p>
                <p className="text-xs text-muted-foreground">
                  L'application fonctionne parfaitement en mode simulation. Toutes les fonctionnalités 
                  sont disponibles avec des données réalistes générées automatiquement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}