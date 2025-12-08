import { normalize, resolve } from 'path'
import { pathToFileURL } from 'url'
import { net, protocol } from 'electron'

export default () => {
	protocol.handle('xfile', request => {
		const path = request.url.replace('xfile://', '')

		const decoded_path = decodeURIComponent(path)
		const normalized_path = normalize(decoded_path)
		const absolute_path = resolve(normalized_path)
		const file_url = pathToFileURL(absolute_path)

		return net.fetch(file_url.toString())
	})
}
