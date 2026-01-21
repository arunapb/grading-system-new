import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { MainNav } from "@/components/MainNav"
import { Providers } from "@/components/Providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Grading System - University of Moratuwa",
    description: "Parse result PDFs and manage student records",
    icons: {
        icon: '/favicon.ico',
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className={inter.className} suppressHydrationWarning>
                <Providers>
                    <MainNav />
                    {children}
                    <Toaster />
                </Providers>
            </body>
        </html>
    )
}
