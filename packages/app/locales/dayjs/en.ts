import type { DayJSLocale } from '@/types'

export default {
	name: 'en',
	weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
	weekStart: 1,
	months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
	relativeTime: {
		future: 'after %s',
		past: '%s ago',
		s: 'a few seconds',
		m: 'a minute',
		mm: '%d minutes',
		h: 'an hour',
		hh: '%d hours',
		d: 'a day',
		dd: '%d days',
		M: 'a month',
		MM: '%d months',
		y: 'a year',
		yy: '%d years'
	},
	ordinal: n => {
		const s = ['th', 'st', 'nd', 'rd']
		const v = n % 100
		return `[${n}${s[(v - 20) % 10] || s[v] || s[0]}]`
	}
} as DayJSLocale
