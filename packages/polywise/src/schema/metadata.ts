import { pgSchema } from 'drizzle-orm/pg-core'

export const META = pgSchema('METADATA')
export const MEM = pgSchema('MEMORY')
export const SYS = pgSchema('SYSTEM')
export const USR = pgSchema('USER')
