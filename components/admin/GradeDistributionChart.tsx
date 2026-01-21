"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface GradeDistributionChartProps {
    distribution: { [grade: string]: number }
    title?: string
    description?: string
}

const GRADE_COLORS: { [key: string]: string } = {
    'A+': '#22c55e',
    'A': '#16a34a',
    'A-': '#15803d',
    'B+': '#3b82f6',
    'B': '#2563eb',
    'B-': '#1d4ed8',
    'C+': '#eab308',
    'C': '#f59e0b',
    'C-': '#d97706',
    'D+': '#ef4444',
    'D': '#dc2626',
    'E': '#991b1b',
}

const GRADE_ORDER = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E']

export function GradeDistributionChart({
    distribution,
    title = "Grade Distribution",
    description = "Distribution of grades across all modules"
}: GradeDistributionChartProps) {
    // Convert distribution object to array and sort by grade order
    const data = GRADE_ORDER
        .filter(grade => distribution[grade] > 0)
        .map(grade => ({
            grade,
            count: distribution[grade] || 0,
            color: GRADE_COLORS[grade] || '#6b7280'
        }))

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        No grade data available
                    </div>
                </CardContent>
            </Card>
        )
    }

    const totalGrades = data.reduce((sum, item) => sum + item.count, 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    {description} • Total: {totalGrades} grades
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="grade"
                            className="text-sm"
                        />
                        <YAxis className="text-sm" />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload
                                    const percentage = ((data.count / totalGrades) * 100).toFixed(1)
                                    return (
                                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                                            <p className="font-semibold">{data.grade}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Count: {data.count}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {percentage}%
                                            </p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
