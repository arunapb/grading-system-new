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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AddBatchDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddBatchDialog({ isOpen, onOpenChange, onSuccess }: AddBatchDialogProps) {
    const [batchName, setBatchName] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!batchName.trim()) {
            toast.error("Please enter a batch name")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/admin/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batchName: batchName.trim() })
            })

            const data = await response.json()

            if (data.success) {
                toast.success("Batch created successfully!")
                setBatchName("")
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(data.error || "Failed to create batch")
            }
        } catch (error) {
            toast.error("An error occurred while creating the batch")
            console.error('Error creating batch:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Batch</DialogTitle>
                    <DialogDescription>
                        Create a new batch to organize students and degrees
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="batchName">Batch Name</Label>
                            <Input
                                id="batchName"
                                placeholder="e.g., batch 21, Batch 2021"
                                value={batchName}
                                onChange={(e) => setBatchName(e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground">
                                This will create a new directory in data/input/
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Batch
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
