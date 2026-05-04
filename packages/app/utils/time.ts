import dayjs from 'dayjs'

export const formatDate = (date?: string | number | Date | dayjs.Dayjs, format = 'YYYY-MM-DD') => {
	return dayjs(date).format(format)
}

export const formatDateTime = (date?: string | number | Date | dayjs.Dayjs, format = 'YYYY-MM-DD HH:mm:ss') => {
	return dayjs(date).format(format)
}

export const formatTime = (date?: string | number | Date | dayjs.Dayjs, format = 'HH:mm:ss') => {
	return dayjs(date).format(format)
}

export const fromNow = (date?: string | number | Date | dayjs.Dayjs | Date | null) => {
	return dayjs(date).fromNow()
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
