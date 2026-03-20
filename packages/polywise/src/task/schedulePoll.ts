import { queue } from '.'
import poll from './poll'

export default (type: string, interval: number) => {
	const old = queue.intervals.get(type)

	if (old) clearTimeout(old)

	queue.intervals.set(
		type,
		setTimeout(() => poll(type), interval)
	)
}
