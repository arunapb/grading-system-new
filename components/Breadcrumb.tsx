import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-primary transition-colors font-medium"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-foreground font-semibold">{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}
