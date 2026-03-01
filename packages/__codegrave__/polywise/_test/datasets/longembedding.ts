import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const text_path = path.join(__dirname, 'text/complex_literature.txt')

const full_text = fs.readFileSync(text_path, 'utf-8')

export const long_text = full_text.slice(0, 100000)
