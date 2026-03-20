import { pauseQueue, resumeQueue } from '.'

let active_search_count = 0

export const pauseTriple = () => {
	active_search_count++

	if (active_search_count === 1) {
		pauseQueue('triple')
	}
}

export const resumeTriple = () => {
	active_search_count--

	if (active_search_count === 0) {
		resumeQueue('triple')
	}
}
