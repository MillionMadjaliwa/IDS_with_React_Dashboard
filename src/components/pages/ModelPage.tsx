import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { 
  Brain, 
  Info, 
  Calendar, 
  Database, 
  Settings, 
  TrendingUp,
  BarChart3
} from "lucide-react";
import { modelInfo } from "../../lib/mock-data";

export function ModelPage() {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Information Card */}
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
                <span className="text-sm text-muted-foreground">Entraîné sur</span>
                <p className="font-semibold">{modelInfo.trainedOn}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Date d'entraînement</span>
                <p className="font-mono text-sm">
                  {new Date(modelInfo.trainingDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Dernière formation</span>
                <p className="font-mono text-sm">
                  {new Date(modelInfo.lastRetrain).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Hyperparamètres</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">n_estimators:</span>
                  <span className="font-mono">{modelInfo.hyperparameters.n_estimators}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">max_depth:</span>
                  <span className="font-mono">{modelInfo.hyperparameters.max_depth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">min_samples_split:</span>
                  <span className="font-mono">{modelInfo.hyperparameters.min_samples_split}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">min_samples_leaf:</span>
                  <span className="font-mono">{modelInfo.hyperparameters.min_samples_leaf}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Metrics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Métriques de Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Précision (Accuracy)</span>
                  <span className="text-sm font-mono">{(modelInfo.metrics.accuracy * 100).toFixed(1)}%</span>
                </div>
                <Progress value={modelInfo.metrics.accuracy * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Précision (Precision)</span>
                  <span className="text-sm font-mono">{(modelInfo.metrics.precision * 100).toFixed(1)}%</span>
                </div>
                <Progress value={modelInfo.metrics.precision * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Rappel (Recall)</span>
                  <span className="text-sm font-mono">{(modelInfo.metrics.recall * 100).toFixed(1)}%</span>
                </div>
                <Progress value={modelInfo.metrics.recall * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">F1-Score</span>
                  <span className="text-sm font-mono">{modelInfo.metrics.f1.toFixed(3)}</span>
                </div>
                <Progress value={modelInfo.metrics.f1 * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">ROC AUC</span>
                  <span className="text-sm font-mono">{modelInfo.metrics.rocAuc.toFixed(3)}</span>
                </div>
                <Progress value={modelInfo.metrics.rocAuc * 100} className="h-2" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Matrice de Confusion</h4>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground">
                  Visualisation de la matrice de confusion disponible
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Importance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Importance des Caractéristiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(modelInfo.featureImportances)
              .sort(([,a], [,b]) => b - a)
              .map(([feature, importance]) => (
              <div key={feature} className="flex items-center gap-4">
                <div className="w-40 text-sm text-muted-foreground">
                  {feature}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(importance / Math.max(...Object.values(modelInfo.featureImportances))) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm font-mono text-right">
                  {(importance * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Input Schema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Schéma d'Entrée des Caractéristiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la Caractéristique</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plage</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelInfo.features.map((feature) => (
                <TableRow key={feature}>
                  <TableCell className="font-mono">{feature}</TableCell>
                  <TableCell><Badge variant="outline">float64</Badge></TableCell>
                  <TableCell className="font-mono text-sm">[0.0, 1.0]</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    Caractéristique normalisée extraite du trafic réseau
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Actions du Modèle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button disabled className="w-full">
                      <Brain className="h-4 w-4 mr-2" />
                      Réentraîner le Modèle
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Le réentraînement n'est pas activé dans cette version</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Modèle en Lecture Seule
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Ce modèle RandomForest a déjà été entraîné et est utilisé pour la détection d'anomalies en temps réel. 
                  Le réentraînement automatique n'est pas disponible dans cette version de démonstration.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}