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

interface AddYearDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    batch: string
    degree: string
    onSuccess: () => void
}

export function AddYearDialog({ open, onOpenChange, batch, degree, onSuccess }: AddYearDialogProps) {
    const [yearName, setYearName] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!yearName.trim()) {
            toast.error("Please enter a year name")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/admin/structure/year', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch, degree, yearName: yearName.trim() })
            })

            const data = await response.json()

            if (data.success) {
                toast.success("Year created successfully")
                setYearName("")
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(data.error || "Failed to create year")
            }
        } catch (error) {
            toast.error("An error occurred")
            console.error('Error creating year:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Year</DialogTitle>
                        <DialogDescription>
                            Add a new year to {degree} in {batch}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="yearName">Year Name</Label>
                        <Input
                            id="yearName"
                            placeholder="e.g., Year 1, Year 2"
                            value={yearName}
                            onChange={(e) => setYearName(e.target.value)}
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
                            Create Year
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
