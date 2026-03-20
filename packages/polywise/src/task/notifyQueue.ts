import { queue } from '.'
import schedulePoll from './schedulePoll'

const MIN = 300

export default (type: string) => {
	queue.ticks.set(type, MIN)

	schedulePoll(type, MIN)
}
