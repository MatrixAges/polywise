import { GoogleGenerativeAI } from '@google/generative-ai'

import { Polywise } from './Polywise'

export class Output {
	private poly: Polywise
	private model: any

	constructor(poly: Polywise, apiKey: string) {
		this.poly = poly
		const genAI = new GoogleGenerativeAI(apiKey)
		this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
	}

	async query(question: string) {
		const snapshot = await this.poly.getSnapshot()
		const context = JSON.stringify(snapshot)

		const prompt = `
      Answer the question based on the following knowledge graph (SVO triples).
      Context: ${context}
      Question: ${question}
    `

		const result = await this.model.generateContent(prompt)
		return result.response.text()
	}

	async getInsights() {
		const snapshot = await this.poly.getSnapshot()
		const context = JSON.stringify(snapshot)

		const prompt = `
      Analyze the following knowledge graph and provide 3 key insights or unexpected connections.
      Context: ${context}
    `

		const result = await this.model.generateContent(prompt)
		return result.response.text()
	}
}
