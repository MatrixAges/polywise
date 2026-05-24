import { createInstance, INDEXEDDB } from 'localforage'

export default createInstance({
	name: 'if',
	driver: INDEXEDDB
})
