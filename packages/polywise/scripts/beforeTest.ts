import 'reflect-metadata'
import '@abraham/reflection'

import { container } from 'tsyringe'

import Pipeline from '../src/Pipeline'

async function beforeTest() {
	const pipeline = container.resolve(Pipeline)
	await pipeline.checkModels()
	console.log('All models are ready.')
}

beforeTest().catch(err => {
	console.error('Failed to check models:', err)
	process.exit(1)
})
