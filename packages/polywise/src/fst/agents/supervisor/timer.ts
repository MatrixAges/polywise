let timer: ReturnType<typeof setInterval> | null = null

export const startTimer = (callback: () => void) => {
	if (timer) return

	timer = setInterval(callback, 30000)
}

export const stopTimer = () => {
	if (timer) {
		clearInterval(timer)
		timer = null
	}
}
