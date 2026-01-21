"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreditInputDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    moduleCode: string
    moduleName: string
    onConfirm: (data: { credits: number; moduleCode: string; moduleName: string }) => void
}

export function CreditInputDialog({
    isOpen,
    onOpenChange,
    moduleCode: initialModuleCode,
    moduleName: initialModuleName,
    onConfirm,
}: CreditInputDialogProps) {
    const [credits, setCredits] = useState("")
    const [moduleCode, setModuleCode] = useState(initialModuleCode)
    const [moduleName, setModuleName] = useState(initialModuleName)
    const [error, setError] = useState("")

    const handleConfirm = () => {
        const creditsNum = parseFloat(credits)

        if (isNaN(creditsNum) || creditsNum <= 0) {
            setError("Please enter a valid credit value (e.g., 1, 2, 2.5, 3)")
            return
        }

        if (!moduleCode.trim()) {
            setError("Module code is required")
            return
        }

        if (!moduleName.trim()) {
            setError("Module name is required")
            return
        }

        onConfirm({ credits: creditsNum, moduleCode: moduleCode.trim(), moduleName: moduleName.trim() })

        // Reset form
        setCredits("")
        setModuleCode(initialModuleCode)
        setModuleName(initialModuleName)
        setError("")
        onOpenChange(false)
    }

    const handleCancel = () => {
        setCredits("")
        setModuleCode(initialModuleCode)
        setModuleName(initialModuleName)
        setError("")
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Enter Module Details</DialogTitle>
                    <DialogDescription>
                        Please provide the credit value and verify the module information before parsing.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="moduleCode">Module Code</Label>
                        <Input
                            id="moduleCode"
                            value={moduleCode}
                            onChange={(e) => setModuleCode(e.target.value)}
                            placeholder="e.g., IN1311"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="moduleName">Module Name</Label>
                        <Input
                            id="moduleName"
                            value={moduleName}
                            onChange={(e) => setModuleName(e.target.value)}
                            placeholder="e.g., Digital System Design"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="credits">Credit Value</Label>
                        <Input
                            id="credits"
                            type="number"
                            step="0.5"
                            min="0"
                            value={credits}
                            onChange={(e) => {
                                setCredits(e.target.value)
                                setError("")
                            }}
                            placeholder="e.g., 1, 2, 2.5, 3"
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm}>Parse PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
