"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AddDegreeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    batch: string
    onSuccess: () => void
}

export function AddDegreeDialog({ open, onOpenChange, batch, onSuccess }: AddDegreeDialogProps) {
    const [degreeName, setDegreeName] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!degreeName.trim()) {
            toast.error("Please enter a degree name")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/admin/structure/degree', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch, degreeName: degreeName.trim() })
            })

            const data = await response.json()

            if (data.success) {
                toast.success("Degree created successfully")
                setDegreeName("")
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(data.error || "Failed to create degree")
            }
        } catch (error) {
            toast.error("An error occurred")
            console.error('Error creating degree:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Degree</DialogTitle>
                        <DialogDescription>
                            Add a new degree to {batch}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="degreeName">Degree Name</Label>
                        <Input
                            id="degreeName"
                            placeholder="e.g., IT, ITM, AI"
                            value={degreeName}
                            onChange={(e) => setDegreeName(e.target.value)}
                            disabled={isLoading}
                            className="mt-2"
                        />
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
                            Create Degree
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
