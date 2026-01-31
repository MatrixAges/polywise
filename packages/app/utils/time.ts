import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export const formatDate = (date?: string | number | Date | dayjs.Dayjs, format = 'YYYY-MM-DD') => {
	return dayjs(date).format(format)
}

export const formatDateTime = (date?: string | number | Date | dayjs.Dayjs, format = 'YYYY-MM-DD HH:mm:ss') => {
	return dayjs(date).format(format)
}

export const formatTime = (date?: string | number | Date | dayjs.Dayjs, format = 'HH:mm:ss') => {
	return dayjs(date).format(format)
}

export const fromNow = (date?: string | number | Date | dayjs.Dayjs) => {
	return dayjs(date).fromNow()
}
