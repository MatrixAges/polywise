import { drizzle } from 'drizzle-orm/pglite'

import client from './pglite'

export default drizzle({ client })
