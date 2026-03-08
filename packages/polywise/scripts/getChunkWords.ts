import { getChunkWords } from '../src/utils'

console.log(getChunkWords('今天纽约的天气真好啊，京华大酒店的张尧经理吃了一只北京烤鸭。'))
console.log(
	getChunkWords(
		'OpenCode is an open source AI coding agent. It’s available as a terminal-based interface, desktop app, or IDE extension.'
	)
)
