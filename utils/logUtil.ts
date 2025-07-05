export type LogType = 'info' | 'success' | 'update' | 'warn' | 'delete' | 'error';

const emoji = {
    info: 'ℹ️',
    success: '✅',
    update: '✏️',
    warn: '⚠️',
    delete: '🗑️',
    error: '❌',
};

const color = {
    info: '\x1b[36m',     // cyan
    success: '\x1b[32m',  // green
    update: '\x1b[34m',   // blue
    warn: '\x1b[33m',     // yellow
    delete: '\x1b[31m',   // red
    error: '\x1b[41m',    // bg red
    reset: '\x1b[0m',
};

export function testLog(type: LogType, message: string, payload?: any) {
    const icon = emoji[type] || '';
    const col = color[type] || color.info;
    process.stdout.write(`${col}${icon} ${message}${color.reset}\n`);
    if (payload !== undefined) {
        console.dir(payload, { depth: 5, colors: true });
    }
}
