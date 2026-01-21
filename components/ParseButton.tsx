"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CreditInputDialog } from "@/components/CreditInputDialog"

interface ParseButtonProps {
    pdfPath: string
    moduleCode: string
    moduleName: string
    onParseComplete: () => void
    batch?: string
    degree?: string
}

export function ParseButton({ pdfPath, moduleCode, moduleName, onParseComplete, batch, degree }: ParseButtonProps) {
    const [isParsing, setIsParsing] = useState(false)
    const [showDialog, setShowDialog] = useState(false)

    const handleParse = async (data: { credits: number; moduleCode: string; moduleName: string }) => {
        setIsParsing(true)

        try {
            const response = await fetch('/api/parse-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pdfPath,
                    credits: data.credits,
                    moduleCode: data.moduleCode,
                    moduleName: data.moduleName,
                    batch,
                    degree,
                }),
            })

            const result = await response.json()

            if (result.success) {
                toast.success(`Successfully parsed! Extracted ${result.recordCount} records.`)
                onParseComplete()
            } else {
                toast.error(`Failed to parse: ${result.error}`)
            }
        } catch (error) {
            toast.error('An error occurred while parsing the PDF')
            console.error('Parse error:', error)
        } finally {
            setIsParsing(false)
        }
    }

    return (
        <>
            <Button
                onClick={() => setShowDialog(true)}
                disabled={isParsing}
                size="sm"
                variant="outline"
            >
                {isParsing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Parsing...
                    </>
                ) : (
                    'Parse'
                )}
            </Button>

            <CreditInputDialog
                isOpen={showDialog}
                onOpenChange={setShowDialog}
                moduleCode={moduleCode}
                moduleName={moduleName}
                onConfirm={handleParse}
            />
        </>
    )
}
