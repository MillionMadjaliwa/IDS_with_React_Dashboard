import { Badge } from "./badge";
import { cn } from "./utils";

type StatusType = "new" | "acknowledged" | "suppressed" | "normal" | "attack";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getVariant = (status: StatusType) => {
    switch (status) {
      case "new":
        return "default";
      case "acknowledged":
        return "secondary";
      case "suppressed":
        return "outline";
      case "normal":
        return "default";
      case "attack":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getCustomStyles = (status: StatusType) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "acknowledged":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "suppressed":
        return "bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400";
      case "normal":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "attack":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "";
    }
  };

  const getLabel = (status: StatusType) => {
    switch (status) {
      case "new":
        return "Nouveau";
      case "acknowledged":
        return "Acquitté";
      case "suppressed":
        return "Supprimé";
      case "normal":
        return "Normal";
      case "attack":
        return "Attaque";
      default:
        return status;
    }
  };

  return (
    <Badge 
      variant={getVariant(status)} 
      className={cn(getCustomStyles(status), className)}
    >
      {getLabel(status)}
    </Badge>
  );
}