import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GraduationCap, Users, ChevronRight } from "lucide-react";

interface BatchCardProps {
    batch: string;
    degreeCount?: number;
    studentCount?: number;
    onClick: () => void;
}

export function BatchCard({ batch, degreeCount = 0, studentCount = 0, onClick }: BatchCardProps) {
    // Extract batch number for display
    const batchNumber = batch.replace(/\D/g, '');

    return (
        <Card
            className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 bg-card"
            onClick={onClick}
        >
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
                            <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                Batch {batchNumber}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Academic Year
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <GraduationCap className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Degrees</span>
                        </div>
                        <p className="text-2xl font-semibold text-foreground">{degreeCount}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Students</span>
                        </div>
                        <p className="text-2xl font-semibold text-foreground">{studentCount}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
