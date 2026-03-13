import fs from 'fs/promises';
import { existsSync } from 'fs';
import { supabase } from './supabase';

const isVercel = process.env.VERCEL === '1';
const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * WriteQueue - Serialises concurrent writes to the same local file.
 */
class WriteQueue {
    private queues: Map<string, Promise<void>> = new Map();

    async enqueue(filePath: string, task: () => Promise<void>): Promise<void> {
        const current = this.queues.get(filePath) ?? Promise.resolve();
        const next = current.then(() => task()).catch(() => task());
        this.queues.set(filePath, next);
        return next;
    }
}

const writeQueue = new WriteQueue();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const vCache: Record<string, any> = {};

/**
 * atomicUpdate - Safely reads, modifies, and writes data.
 * Prioritizes Supabase if available.
 */
export async function atomicUpdate(filePath: string, updater: (data: any) => any) {
    const fileName = filePath.split(/[\\/]/).pop() || filePath;

    if (hasSupabase) {
        try {
            // Read from Supabase
            const { data: row, error: readError } = await supabase
                .from('app_data')
                .select('content')
                .eq('id', fileName)
                .single();

            let currentData = row?.content || (await safeRead(filePath));
            const updatedData = await updater(JSON.parse(JSON.stringify(currentData)));

            // Write to Supabase
            const { error: writeError } = await supabase
                .from('app_data')
                .upsert({ id: fileName, content: updatedData, updated_at: new Date().toISOString() });

            if (writeError) throw writeError;
            return updatedData;
        } catch (error) {
            console.error(`Supabase update failed for ${fileName}, falling back:`, error);
        }
    }

    if (isVercel) {
        const currentData = vCache[filePath] || await safeRead(filePath);
        const updatedData = await updater(JSON.parse(JSON.stringify(currentData)));
        vCache[filePath] = updatedData;
        return updatedData;
    }

    return writeQueue.enqueue(filePath, async () => {
        let retries = 5;
        while (retries > 0) {
            try {
                let currentData = await safeRead(filePath);
                const updatedData = await updater(currentData);
                const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
                const content = JSON.stringify(updatedData, null, 2);
                await fs.writeFile(tempPath, content, 'utf8');
                await fs.rename(tempPath, filePath);
                return updatedData;
            } catch (error: any) {
                retries--;
                if (retries === 0 || !['EBUSY', 'EPERM', 'EACCES'].includes(error.code)) {
                    console.error(`Local atomicUpdate failed:`, error);
                    throw error;
                }
                await delay(150);
            }
        }
    });
}

/**
 * atomicWrite - Writes data safely. Prioritizes Supabase.
 */
export async function atomicWrite(filePath: string, data: any) {
    const fileName = filePath.split(/[\\/]/).pop() || filePath;

    if (hasSupabase) {
        try {
            await supabase
                .from('app_data')
                .upsert({ id: fileName, content: data, updated_at: new Date().toISOString() });
            return;
        } catch (error) {
            console.error(`Supabase write failed for ${fileName}:`, error);
        }
    }

    if (isVercel) {
        vCache[filePath] = JSON.parse(JSON.stringify(data));
        return;
    }

    return writeQueue.enqueue(filePath, async () => {
        let retries = 5;
        while (retries > 0) {
            try {
                const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
                const content = JSON.stringify(data, null, 2);
                await fs.writeFile(tempPath, content, 'utf8');
                await fs.rename(tempPath, filePath);
                return;
            } catch (error: any) {
                retries--;
                if (retries === 0 || !['EBUSY', 'EPERM', 'EACCES'].includes(error.code)) break;
                await delay(150);
            }
        }
    });
}

export async function safeRead(filePath: string, fallback: any = []) {
    const fileName = filePath.split(/[\\/]/).pop() || filePath;

    if (hasSupabase) {
        try {
            const { data: row, error } = await supabase
                .from('app_data')
                .select('content')
                .eq('id', fileName)
                .single();
            
            if (error) {
                // If it's a 406 (Not Acceptable) or PGRST116 (No rows found), it simply hasn't been created yet
                if (error.code !== 'PGRST116') {
                    console.error(`Supabase read error for ${fileName}:`, error.message);
                }
            } else if (row?.content) {
                return row.content;
            }
        } catch (error) {
            console.error(`Supabase read exception for ${fileName}:`, error);
        }
    }

    if (isVercel && vCache[filePath]) {
        return JSON.parse(JSON.stringify(vCache[filePath]));
    }

    let retries = 3; // Reduced retries to avoid timeouts
    while (retries > 0) {
        try {
            if (!existsSync(filePath)) return fallback;
            const content = await fs.readFile(filePath, 'utf8');
            if (!content || content.trim() === '') return fallback;
            const data = JSON.parse(content);
            if (isVercel) vCache[filePath] = data;
            return data;
        } catch (error: any) {
            if (['EBUSY', 'EPERM', 'EACCES'].includes(error.code)) {
                retries--;
                if (retries > 0) {
                    await delay(100);
                    continue;
                }
            }
            break;
        }
    }
    return fallback;
}
