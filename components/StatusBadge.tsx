import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";

interface StatusBadgeProps {
    hasOutput: boolean;
}

export function StatusBadge({ hasOutput }: StatusBadgeProps) {
    if (hasOutput) {
        return (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 font-medium">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Parsed
            </Badge>
        );
    }

    return (
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-200 font-medium">
            <Clock className="h-3 w-3 mr-1" />
            Pending
        </Badge>
    );
}
