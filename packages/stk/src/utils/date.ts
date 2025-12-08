export const isMillisecondTimestamp = (value: number) => {
	const start_timestamp = 0 // 1970-01-01
	const end_timestamp = 4102444800000 // 2100-01-01

	return value.toString().length === 13 && value > start_timestamp && value < end_timestamp
}
