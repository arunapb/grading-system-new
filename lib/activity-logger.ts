import fs from 'fs'
import path from 'path'

interface ActivityLog {
    timestamp: string
    action: string
    details: any
    success: boolean
}

const LOG_FILE = path.join(process.cwd(), 'data', 'logs', 'activity.json')
const MAX_LOGS = 1000 // Keep last 1000 entries

/**
 * Log an admin activity
 */
export async function logActivity(
    action: string,
    details: any,
    success: boolean = true
): Promise<void> {
    try {
        // Ensure logs directory exists
        const logsDir = path.dirname(LOG_FILE)
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true })
        }

        // Read existing logs
        let logs: ActivityLog[] = []
        if (fs.existsSync(LOG_FILE)) {
            try {
                const content = fs.readFileSync(LOG_FILE, 'utf-8')
                logs = JSON.parse(content)
            } catch {
                logs = []
            }
        }

        // Add new log
        logs.unshift({
            timestamp: new Date().toISOString(),
            action,
            details,
            success
        })

        // Keep only last MAX_LOGS entries
        if (logs.length > MAX_LOGS) {
            logs = logs.slice(0, MAX_LOGS)
        }

        // Write back to file
        fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8')
    } catch (error) {
        console.error('Failed to log activity:', error)
        // Don't throw - logging failure shouldn't break the app
    }
}

/**
 * Get recent activity logs
 */
export function getActivityLogs(limit: number = 50): ActivityLog[] {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return []
        }

        const content = fs.readFileSync(LOG_FILE, 'utf-8')
        const logs: ActivityLog[] = JSON.parse(content)

        return logs.slice(0, limit)
    } catch (error) {
        console.error('Failed to read activity logs:', error)
        return []
    }
}

/**
 * Clear all activity logs
 */
export function clearActivityLogs(): void {
    try {
        if (fs.existsSync(LOG_FILE)) {
            fs.unlinkSync(LOG_FILE)
        }
    } catch (error) {
        console.error('Failed to clear activity logs:', error)
    }
}
