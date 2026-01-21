"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Info, XCircle } from "lucide-react"
import { ReactNode } from "react"

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string | ReactNode
    confirmText?: string
    cancelText?: string
    variant?: "info" | "warning" | "danger"
    onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "warning",
    onConfirm
}: ConfirmDialogProps) {
    const icons = {
        info: <Info className="h-5 w-5 text-blue-600" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        danger: <XCircle className="h-5 w-5 text-red-600" />
    }

    const buttonVariants = {
        info: "default",
        warning: "default",
        danger: "destructive"
    } as const

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        {icons[variant]}
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div>{description}</div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={buttonVariants[variant] === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
