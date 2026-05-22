import dayjs from 'dayjs'

const normalizeDateInput = (date?: string | number | Date | dayjs.Dayjs | null) => {
	if (typeof date === 'number' && Number.isFinite(date) && Math.abs(date) < 1_000_000_000_000) {
		return date * 1000
	}

	return date
}

export const formatDate = (date?: string | number | Date | dayjs.Dayjs, format = 'YYYY-MM-DD') => {
	return dayjs(normalizeDateInput(date)).format(format)
}

export const formatDateTime = (date?: string | number | Date | dayjs.Dayjs, format = 'YYYY-MM-DD HH:mm:ss') => {
	return dayjs(normalizeDateInput(date)).format(format)
}

export const formatTime = (date?: string | number | Date | dayjs.Dayjs, format = 'HH:mm:ss') => {
	return dayjs(normalizeDateInput(date)).format(format)
}

export const fromNow = (date?: string | number | Date | dayjs.Dayjs | Date | null) => {
	return dayjs(normalizeDateInput(date)).fromNow()
}

export const getDurationTime = (v: number): string => {
	const duration = dayjs.duration(v)

	const hours = Math.floor(duration.asHours())
	const mins = duration.minutes()
	const secs = duration.seconds()

	if (hours > 0) {
		return `${hours}h${mins}m${secs}s`
	}

	if (mins > 0) {
		return `${mins}m${secs}s`
	}

	return `${secs}s`
}
