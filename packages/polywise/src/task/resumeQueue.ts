import { emitter, queue } from '.'

export default (type: string) => {
	const q = queue.map.get(type)

	if (q) q.resume()

	emitter.emit('change')
}
