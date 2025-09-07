import { Card, CardContent } from "./card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiTileProps {
  title: string;
  value: string | number;
  delta?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
    label: string;
  };
  sparkline?: number[];
  className?: string;
}

export function KpiTile({ title, value, delta, sparkline, className }: KpiTileProps) {
  const getDeltaIcon = () => {
    if (!delta) return null;
    
    switch (delta.type) {
      case "increase":
        return <TrendingUp className="h-3 w-3" />;
      case "decrease":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getDeltaColor = () => {
    if (!delta) return "";
    
    switch (delta.type) {
      case "increase":
        return "text-success";
      case "decrease":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-semibold">{value}</p>
            {sparkline && sparkline.length > 0 && (
              <div className="flex items-end gap-px h-8">
                {sparkline.slice(-12).map((point, index) => {
                  const maxValue = Math.max(...sparkline);
                  const safeHeight = maxValue > 0 ? Math.max(2, (point / maxValue) * 32) : 2;
                  return (
                    <div
                      key={`sparkline-${index}-${point}`}
                      className="bg-primary/20 w-1"
                      style={{
                        height: `${safeHeight}px`,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
          {delta && (
            <div className={`flex items-center gap-1 text-sm ${getDeltaColor()}`}>
              {getDeltaIcon()}
              <span>{delta.value > 0 ? "+" : ""}{delta.value}</span>
              <span className="text-muted-foreground">{delta.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}