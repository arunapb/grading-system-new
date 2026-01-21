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

interface AddSemesterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    batch: string
    degree: string
    year: string
    onSuccess: () => void
}

export function AddSemesterDialog({
    open,
    onOpenChange,
    batch,
    degree,
    year,
    onSuccess
}: AddSemesterDialogProps) {
    const [semesterName, setSemesterName] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!semesterName.trim()) {
            toast.error("Please enter a semester name")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/admin/structure/semester', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch,
                    degree,
                    year,
                    semesterName: semesterName.trim()
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success("Semester created successfully")
                setSemesterName("")
                onOpenChange(false)
                onSuccess()
            } else {
                toast.error(data.error || "Failed to create semester")
            }
        } catch (error) {
            toast.error("An error occurred")
            console.error('Error creating semester:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Semester</DialogTitle>
                        <DialogDescription>
                            Add a new semester to {year} in {degree} ({batch})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="semesterName">Semester Name</Label>
                        <Input
                            id="semesterName"
                            placeholder="e.g., Semester 1, Semester 2"
                            value={semesterName}
                            onChange={(e) => setSemesterName(e.target.value)}
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
                            Create Semester
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
