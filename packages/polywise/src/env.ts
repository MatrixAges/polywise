import { app } from './consts'

interface Env {
	pglite_data_dir: string
}

export default {
	pglite_data_dir: app.data_dir
} as Env
