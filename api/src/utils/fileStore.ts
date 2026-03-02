import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { logApiError } from './log.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR ?? join(__dirname, '..', '..')
const DATA_FILE = join(DATA_DIR, 'data.json')

export async function readStore<T>(): Promise<T> {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as T
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException
    if (nodeErr.code === 'ENOENT') {
      return {} as T
    }
    logApiError(err, 'fileStore.readStore', { path: DATA_FILE })
    throw err
  }
}

export async function writeStore<T>(data: T): Promise<void> {
  await mkdir(dirname(DATA_FILE), { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}
