import getContext from '../../context/getContext'
import setContext from '../../context/setContext'
import getState from '../../state/getState'
import setState from '../../state/setState'
import clearTasks from '../../task/clearTasks'
import getTasks from '../../task/getTasks'
import setTasks from '../../task/setTasks'

import type { StoreCap } from '../../core/types'

const defaultStore: StoreCap = {
	getContext: getContext as StoreCap['getContext'],
	setContext: setContext as StoreCap['setContext'],
	getTasks: getTasks as StoreCap['getTasks'],
	setTasks: setTasks as StoreCap['setTasks'],
	clearTasks: clearTasks as StoreCap['clearTasks'],
	getState: getState as StoreCap['getState'],
	setState: setState as StoreCap['setState']
}

export default defaultStore
