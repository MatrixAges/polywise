import { generateObject, type LanguageModel } from 'ai'
import { z } from 'zod'

export interface GroupMessage {
	id: string
	role: 'user' | 'agent' | 'system'
	agentId?: string
	content: string
	timestamp: number
}

export interface GroupAgent {
	id: string
	name: string
	description: string
	fastModel: LanguageModel
	model: LanguageModel // Adding model per user request for full text generation, although not used here directly as generateReply handles it
	generateReply: (messages: GroupMessage[]) => Promise<string | null>
}

export class AgentGroup {
	private agents: Map<string, GroupAgent> = new Map()
	private messages: GroupMessage[] = []
	private isSpeaking: boolean = false
	private queue: string[] = [] // Queue of agent IDs

	// Register an agent to the group
	addAgent(agent: GroupAgent) {
		this.agents.set(agent.id, agent)
	}

	// Remove an agent from the group
	removeAgent(agentId: string) {
		this.agents.delete(agentId)
	}

	// Get all current messages
	getMessages() {
		return [...this.messages]
	}

	// Broadcast a message to the group
	async broadcast(message: GroupMessage) {
		this.messages.push(message)

		// Trigger evaluation for all agents asynchronously
		for (const [agentId, agent] of this.agents.entries()) {
			// Do not let the agent evaluate its own message immediately to reply to itself
			if (message.role === 'agent' && message.agentId === agentId) {
				continue
			}

			// Background evaluation
			this.evaluateAndQueue(agent).catch(err => {
				console.error(`Agent ${agent.name} evaluation error:`, err)
			})
		}
	}

	// Evaluate if an agent wants to speak, and if so, enqueue or speak
	private async evaluateAndQueue(agent: GroupAgent) {
		const wantsToSpeak = await this.evaluateIntention(agent)

		if (wantsToSpeak) {
			if (this.queue.includes(agent.id)) {
				// Already in queue
				return
			}
			this.queue.push(agent.id)
			this.processQueue()
		}
	}

	// Lightweight intention evaluation
	private async evaluateIntention(agent: GroupAgent): Promise<boolean> {
		try {
			const recentMessages = this.messages.slice(-5) // Use recent context to save tokens
			const systemPrompt = `You are ${agent.name}. ${agent.description}
Analyze the recent conversation and decide if you need to reply.
Respond with wantsToSpeak: true if you should reply, or false otherwise.`

			const result = await generateObject({
				model: agent.fastModel,
				system: systemPrompt,
				messages: recentMessages.map(m => ({
					role: m.role === 'agent' ? (m.agentId === agent.id ? 'assistant' : 'user') : m.role === 'user' ? 'user' : 'system',
					content: m.role === 'agent' ? `[${this.agents.get(m.agentId!)?.name || 'Unknown'}]: ${m.content}` : m.content
				})),
				schema: z.object({
					wantsToSpeak: z.boolean().describe('Whether you should reply to the conversation')
				})
			})

			return result.object.wantsToSpeak
		} catch (error) {
			console.error(`Intention evaluation failed for agent ${agent.name}:`, error)
			return false
		}
	}

	// Process the queue
	private async processQueue() {
		if (this.isSpeaking || this.queue.length === 0) {
			return
		}

		// Lock
		this.isSpeaking = true

		try {
			while (this.queue.length > 0) {
				const currentAgentId = this.queue.shift()!
				const agent = this.agents.get(currentAgentId)

				if (!agent) continue

				// Secondary evaluation: The context might have changed while waiting
				const stillWantsToSpeak = await this.evaluateIntention(agent)

				if (stillWantsToSpeak) {
					// Agent generates a reply
					let replyContent: string | null = null
					try {
						replyContent = await agent.generateReply(this.messages)
					} catch (error) {
						console.error(`Reply generation failed for agent ${agent.name}:`, error)
					}

					if (replyContent) {
						const replyMessage: GroupMessage = {
							id: Math.random().toString(36).substring(7),
							role: 'agent',
							agentId: agent.id,
							content: replyContent,
							timestamp: Date.now()
						}

						// Push the message directly and then broadcast to others
						this.messages.push(replyMessage)

						// Broadcast to other agents (evaluating asynchronously)
						for (const [otherAgentId, otherAgent] of this.agents.entries()) {
							if (otherAgentId !== agent.id) {
								this.evaluateAndQueue(otherAgent).catch(err => {
									console.error(`Agent ${otherAgent.name} evaluation error:`, err)
								})
							}
						}
					}
				}
			}
		} finally {
			// Unlock
			this.isSpeaking = false

			// Re-check queue in case new elements arrived
			if (this.queue.length > 0) {
				this.processQueue()
			}
		}
	}
}
