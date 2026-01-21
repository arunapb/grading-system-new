"use client"

import { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/StatusBadge"
import { ParseButton } from "@/components/ParseButton"
import { BatchParseDialog } from "@/components/BatchParseDialog"
import { ArrowUpDown, Download, Loader2, Check, X } from "lucide-react"
import { toast } from "sonner"

interface PDFInfo {
    pdfPath: string
    outputPath: string
    hasOutput: boolean
    year: string
    semester: string
    filename: string
    moduleCode: string
    moduleName: string
    credits: number | null
}

interface PDFTableProps {
    pdfs: PDFInfo[]
    onRefresh: () => void
    batch?: string
    degree?: string
}

type SortField = 'moduleCode' | 'moduleName' | 'credits' | 'year' | 'semester'
type SortOrder = 'asc' | 'desc'

export function PDFTable({ pdfs, onRefresh, batch, degree }: PDFTableProps) {
    const [sortField, setSortField] = useState<SortField>('year')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
    const [isParsingAll, setIsParsingAll] = useState(false)
    const [editingCell, setEditingCell] = useState<{ path: string, field: string } | null>(null)
    const [editValue, setEditValue] = useState('')

    const sortedPDFs = useMemo(() => {
        return [...pdfs].sort((a, b) => {
            let aVal = String(a[sortField] || '')
            let bVal = String(b[sortField] || '')

            if (sortOrder === 'asc') {
                return aVal.localeCompare(bVal)
            } else {
                return bVal.localeCompare(aVal)
            }
        })
    }, [pdfs, sortField, sortOrder])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
    }

    const [showBatchDialog, setShowBatchDialog] = useState(false)

    const handleParseAll = async () => {
        const missingCount = pdfs.filter(p => !p.hasOutput).length

        if (missingCount === 0) {
            toast.info('All PDFs are already parsed!')
            return
        }

        // Show dialog with missing PDFs
        setShowBatchDialog(true)
    }

    const handleBatchParse = async (
        pdfsWithMetadata: Array<{ pdfPath: string; moduleCode: string; moduleName: string; credits: number }>,
        onProgress: (current: number, total: number) => void
    ) => {
        setIsParsingAll(true)
        let successCount = 0
        let failCount = 0

        for (let i = 0; i < pdfsWithMetadata.length; i++) {
            const pdf = pdfsWithMetadata[i]

            // Update progress before processing
            onProgress(i, pdfsWithMetadata.length)

            try {
                const response = await fetch('/api/parse-pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        pdfPath: pdf.pdfPath,
                        credits: pdf.credits,
                        moduleCode: pdf.moduleCode,
                        moduleName: pdf.moduleName,
                        batch,
                        degree,
                    }),
                })

                const result = await response.json()

                if (result.success) {
                    successCount++
                } else {
                    failCount++
                    console.error(`Failed to parse ${pdf.pdfPath}:`, result.error)
                }
            } catch (error) {
                failCount++
                console.error(`Error parsing ${pdf.pdfPath}:`, error)
            }
        }

        // Update progress to completion
        onProgress(pdfsWithMetadata.length, pdfsWithMetadata.length)

        setIsParsingAll(false)

        if (successCount > 0) {
            toast.success(`Successfully parsed ${successCount} PDF${successCount !== 1 ? 's' : ''}!`)
            onRefresh()
        }

        if (failCount > 0) {
            toast.error(`Failed to parse ${failCount} PDF${failCount !== 1 ? 's' : ''}`)
        }
    }

    const handleDownloadJSON = (pdfInfo: PDFInfo) => {
        if (!pdfInfo.hasOutput) {
            toast.error('JSON file does not exist. Parse the PDF first.')
            return
        }

        // Create download link
        const link = document.createElement('a')
        link.href = `/${pdfInfo.outputPath}`
        link.download = `${pdfInfo.filename}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success('JSON download started')
    }

    const startEditing = (pdfPath: string, field: string, currentValue: any) => {
        setEditingCell({ path: pdfPath, field })
        setEditValue(String(currentValue || ''))
    }

    const cancelEditing = () => {
        setEditingCell(null)
        setEditValue('')
    }

    const saveEdit = async (pdfPath: string, field: string) => {
        try {
            const updateData: any = { pdfPath }

            if (field === 'credits') {
                const creditsNum = parseFloat(editValue)
                if (isNaN(creditsNum) || creditsNum <= 0) {
                    toast.error('Please enter a valid credit value')
                    return
                }
                updateData.credits = creditsNum
            } else {
                updateData[field] = editValue.trim()
            }

            const response = await fetch('/api/update-metadata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Metadata updated successfully')
                cancelEditing()
                onRefresh()
            } else {
                toast.error(`Failed to update: ${data.error}`)
            }
        } catch (error) {
            toast.error('An error occurred while updating metadata')
            console.error('Update error:', error)
        }
    }

    const missingCount = pdfs.filter(p => !p.hasOutput).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {pdfs.length} PDFs found • {missingCount} not parsed
                </div>
                <Button
                    onClick={handleParseAll}
                    disabled={isParsingAll || missingCount === 0}
                    variant="default"
                >
                    {isParsingAll ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Parsing All...
                        </>
                    ) : (
                        `Parse All Missing (${missingCount})`
                    )}
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSort('moduleCode')}
                                    className="h-8 -ml-3"
                                >
                                    Module Code
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSort('moduleName')}
                                    className="h-8 -ml-3"
                                >
                                    Module Name
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSort('credits')}
                                    className="h-8 -ml-3"
                                >
                                    Credit
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSort('year')}
                                    className="h-8 -ml-3"
                                >
                                    Year
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSort('semester')}
                                    className="h-8 -ml-3"
                                >
                                    Semester
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedPDFs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground">
                                    No PDFs found in the data directory
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedPDFs.map((pdf) => (
                                <TableRow key={pdf.pdfPath}>
                                    <TableCell className="font-medium">
                                        {editingCell?.path === pdf.pdfPath && editingCell?.field === 'moduleCode' ? (
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="h-8"
                                                    autoFocus
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveEdit(pdf.pdfPath, 'moduleCode')}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <span onClick={() => startEditing(pdf.pdfPath, 'moduleCode', pdf.moduleCode)} className="cursor-pointer hover:bg-accent px-2 py-1 rounded">
                                                {pdf.moduleCode}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingCell?.path === pdf.pdfPath && editingCell?.field === 'moduleName' ? (
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="h-8"
                                                    autoFocus
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveEdit(pdf.pdfPath, 'moduleName')}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <span onClick={() => startEditing(pdf.pdfPath, 'moduleName', pdf.moduleName)} className="cursor-pointer hover:bg-accent px-2 py-1 rounded">
                                                {pdf.moduleName}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingCell?.path === pdf.pdfPath && editingCell?.field === 'credits' ? (
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    step="0.5"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="h-8 w-20"
                                                    autoFocus
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveEdit(pdf.pdfPath, 'credits')}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <span onClick={() => startEditing(pdf.pdfPath, 'credits', pdf.credits)} className="cursor-pointer hover:bg-accent px-2 py-1 rounded">
                                                {pdf.credits !== null ? pdf.credits : '-'}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>{pdf.year}</TableCell>
                                    <TableCell>{pdf.semester}</TableCell>
                                    <TableCell>
                                        <StatusBadge hasOutput={pdf.hasOutput} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <ParseButton
                                                pdfPath={pdf.pdfPath}
                                                moduleCode={pdf.moduleCode}
                                                moduleName={pdf.moduleName}
                                                onParseComplete={onRefresh}
                                                batch={batch}
                                                degree={degree}
                                            />
                                            <Button
                                                onClick={() => handleDownloadJSON(pdf)}
                                                disabled={!pdf.hasOutput}
                                                size="sm"
                                                variant="ghost"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <BatchParseDialog
                isOpen={showBatchDialog}
                onOpenChange={setShowBatchDialog}
                pdfs={pdfs.filter(p => !p.hasOutput)}
                onConfirm={handleBatchParse}
            />
        </div>
    )
}
