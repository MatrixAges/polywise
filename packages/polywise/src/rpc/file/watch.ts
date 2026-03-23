import { EventEmitter, on } from 'events'
import { resolve } from 'path'
import { app } from '@core/consts'
import { p } from '@core/utils'
import { readFile } from 'atomically'
import to from 'await-to-js'
import Watchpack from 'watchpack'
import { array, string } from 'zod'

type Res = Record<string, undefined | any>

const input_type = array(string())

export default p.input(input_type).subscription(async function* (args) {
	const { signal, input } = args
	const files = input.map(item => resolve(`${app.app_path}/${item}.json`))

	const e = new EventEmitter()
	const watchpack = new Watchpack({ aggregateTimeout: 30, poll: false })

	const getFiles = async (paths: Array<string>) => {
		return Promise.all(
			paths.map(async item => {
				const [err, res] = await to(readFile(item))

				if (err) return undefined

				return JSON.parse(res.toString())
			})
		)
	}

	const query = async () => {
		const results = await getFiles(files)

		return input.reduce((total, item, index) => {
			total[item] = results[index]

			return total
		}, {} as Res)
	}

	yield query()

	const onChange = async (args: Set<string>) => {
		const paths = Array.from(args)

		const results = await getFiles(paths)

		const target = paths.reduce((total, item, index) => {
			const path_input = input.find(i => item.includes(i))!

			total[path_input] = results[index]

			return total
		}, {} as Res)

		e.emit('CHANGE', target)
	}

	try {
		watchpack.watch({ files })
		watchpack.on('aggregated', onChange)

		for await (const [data] of on(e, 'CHANGE', { signal })) {
			yield data as Res
		}
	} finally {
		watchpack.close()

		e.removeAllListeners()
	}
})
