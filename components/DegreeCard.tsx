import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Monitor, Briefcase, Brain, Users, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DegreeCardProps {
    degree: string;
    studentCount?: number;
    hasData?: boolean;
    onClick: () => void;
}

const degreeIcons = {
    'IT': Monitor,
    'ITM': Briefcase,
    'AI': Brain,
};

const degreeNames = {
    'IT': 'Information Technology',
    'ITM': 'IT Management',
    'AI': 'Artificial Intelligence',
};

const degreeColors = {
    'IT': 'bg-blue-500/10 text-blue-600',
    'ITM': 'bg-purple-500/10 text-purple-600',
    'AI': 'bg-emerald-500/10 text-emerald-600',
};

export function DegreeCard({ degree, studentCount = 0, hasData = false, onClick }: DegreeCardProps) {
    const Icon = degreeIcons[degree as keyof typeof degreeIcons] || Monitor;
    const fullName = degreeNames[degree as keyof typeof degreeNames] || degree;
    const colorClass = degreeColors[degree as keyof typeof degreeColors] || 'bg-slate-500/10 text-slate-600';

    return (
        <Card
            className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 bg-card"
            onClick={onClick}
        >
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 ${colorClass} rounded-lg group-hover:scale-105 transition-transform`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                {degree}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {fullName}
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Students</span>
                        </div>
                        <p className="text-2xl font-semibold text-foreground">{studentCount}</p>
                    </div>
                    {hasData && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                            Active
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
