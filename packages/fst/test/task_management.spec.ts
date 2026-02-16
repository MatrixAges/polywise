import { beforeAll, describe, expect, it } from '@rstest/core'
import fs from 'fs-extra'

import Fst from '../src/Fst'
import { getId, getPath } from '../src/utils'

describe('Scenario 01: Multi-turn Task Management', () => {
	let fst: Fst
	const conversation_id = getId()

	beforeAll(async () => {
		fst = new Fst()
		fst.conversation_id = conversation_id
		await fst.init()
	})

	it('should create, update, and complete a task through multiple turns', async () => {
		// Turn 1: Create task
		const res1 = await fst.think('Create a new task "Refactor Storage" with status "pending".')
		await res1.text
		let shadow = (fst as any).session.getShadowContext()
		expect(shadow.tasks.some((t: any) => t.name === 'Refactor Storage')).toBe(true)

		// Turn 2: Update task
		const res2 = await fst.think('Update the status of "Refactor Storage" to "in_progress".')
		await res2.text
		shadow = (fst as any).session.getShadowContext()
		expect(shadow.tasks.find((t: any) => t.name === 'Refactor Storage').status).toBe('in_progress')

		// Turn 3: Complete task
		const res3 = await fst.think('Mark the "Refactor Storage" task as "completed" and update the summary.')
		await res3.text
		shadow = (fst as any).session.getShadowContext()
		expect(shadow.tasks.find((t: any) => t.name === 'Refactor Storage').status).toBe('completed')
	}, 60000)
})
