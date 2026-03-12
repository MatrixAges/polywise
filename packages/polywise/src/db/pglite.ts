import { env } from '@core/env'
import { PGlite } from '@electric-sql/pglite'
import { live } from '@electric-sql/pglite/live'
import { vector } from '@electric-sql/pglite/vector'

export default await PGlite.create(env.pglite_data_dir, { extensions: { vector, live } })
