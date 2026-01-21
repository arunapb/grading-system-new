"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Loader2, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UploadResult {
    filename: string
    success: boolean
    error?: string
    parsed?: boolean
    studentCount?: number
}

interface UploadProgressProps {
    isUploading: boolean
    progress: number
    results: UploadResult[]
}

export function UploadProgress({ isUploading, progress, results }: UploadProgressProps) {
    if (!isUploading && results.length === 0) {
        return null
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Upload Progress</CardTitle>
                    {isUploading && (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overall Progress */}
                {isUploading && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Uploading and parsing...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                {/* Summary */}
                {results.length > 0 && (
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>{successCount} successful</span>
                        </div>
                        {failedCount > 0 && (
                            <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span>{failedCount} failed</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Results List */}
                {results.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                            >
                                {result.success ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium truncate">{result.filename}</p>
                                    </div>
                                    {result.success ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            {result.parsed ? (
                                                <>
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                        Parsed
                                                    </Badge>
                                                    {result.studentCount !== undefined && (
                                                        <span>{result.studentCount} students found</span>
                                                    )}
                                                </>
                                            ) : (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                    Uploaded (Parse failed)
                                                </Badge>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-red-600">{result.error || 'Upload failed'}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
