import { Badge } from "./badge";
import { cn } from "./utils";

type SeverityLevel = "informational" | "low" | "medium" | "high" | "critical";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const getVariant = (level: SeverityLevel) => {
    switch (level) {
      case "informational":
        return "secondary";
      case "low":
        return "default";
      case "medium":
        return "default";
      case "high":
        return "destructive";
      case "critical":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getCustomStyles = (level: SeverityLevel) => {
    switch (level) {
      case "informational":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "";
    }
  };

  const getLabel = (level: SeverityLevel) => {
    switch (level) {
      case "informational":
        return "Info";
      case "low":
        return "Faible";
      case "medium":
        return "Moyen";
      case "high":
        return "Élevé";
      case "critical":
        return "Critique";
      default:
        return level;
    }
  };

  return (
    <Badge 
      variant={getVariant(severity)} 
      className={cn(getCustomStyles(severity), className)}
    >
      {getLabel(severity)}
    </Badge>
  );
}