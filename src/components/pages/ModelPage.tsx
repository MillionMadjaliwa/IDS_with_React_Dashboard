import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Brain } from "lucide-react";
import { useEffect, useState } from "react";
import { realPacketCaptureService, ModelInfo } from "../../lib/real-packet-capture-service";

export function ModelPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    realPacketCaptureService.connect().then(() => {
      return realPacketCaptureService.getModelInfo();
    }).then((info) => {
      if (mounted) setModelInfo(info);
    }).catch((e) => {
      setError("Impossible de récupérer les infos du modèle : " + e.message);
    }).finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Modèle (RandomForest)</h1>
          <p className="text-muted-foreground">
            Gestion du modèle d'apprentissage automatique - Lecture seule
          </p>
        </div>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
          Lecture seule
        </Badge>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Chargement des infos du modèle...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {modelInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Informations du Modèle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Modèle</span>
                  <p className="font-semibold">{modelInfo.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Version</span>
                  <p className="font-semibold">{modelInfo.version}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-muted-foreground">Features</span>
                  <p className="font-mono text-xs break-all">{modelInfo.features?.join(', ')}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Hyperparamètres</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(modelInfo.hyperparameters || {}).map(([k, v]) => (
                    <div className="flex justify-between" key={k}>
                      <span className="text-muted-foreground">{k}:</span>
                      <span className="font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {modelInfo.is_dummy && (
                <div className="pt-2 text-xs text-yellow-700">Modèle factice utilisé (démo)</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}