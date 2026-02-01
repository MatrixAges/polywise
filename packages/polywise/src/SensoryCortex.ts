import { GoogleGenerativeAI } from '@google/generative-ai'

import { Polywise } from './Polywise'

interface SVOExtract {
	subject: string
	predicate: string
	object: string
	confidence: number
}

export class SensoryCortex {
	private poly: Polywise
	private model: any

	constructor(poly: Polywise, apiKey: string) {
		this.poly = poly
		const genAI = new GoogleGenerativeAI(apiKey)
		this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
	}

	async processArticle(title: string, content: string) {
		const res = await (this.poly as any).db.query(
			'INSERT INTO knowledge.articles (title, content) VALUES ($1, $2) RETURNING id',
			[title, content]
		)
		const article_id = res.rows[0].id

		const prompt = `
      Analyze the following text and extract core knowledge as Subject-Predicate-Object (SVO) triples.
      
      CRITICAL: For each relationship, determine two physics parameters based on CONTEXT:
      1. "learning_rate" (0.1 - 3.0): How impactful/active is this action? 
         - High (2.0+): "crashes", "destroys", "invents", "saves".
         - Low (0.5): "is", "has", "includes".
      2. "decay_resistance" (0.1 - 3.0): How fundamental/permanent is this truth?
         - High (2.0+): Core principles, laws.
         - Low (0.5): Temporary states, random details.

      Return ONLY a JSON array: 
      [{"subject": "Electron", "predicate": "uses", "object": "Chromium", "learning_rate": 0.8, "decay_resistance": 2.0}]
      
      Text: ${content.substring(0, 8000)}
    `

		const result = await this.model.generateContent(prompt)
		const response_text = result.response.text()
		const clean_json = response_text.replace(/```json|```/g, '').trim()

		try {
			const triples: any[] = JSON.parse(clean_json)
			await this.injectTriples(triples, article_id)
			return triples
		} catch (e) {
			console.error('Failed to parse Gemini SVO output', e)
		}
	}

	private async injectTriples(triples: any[], article_id: number) {
		const db = (this.poly as any).db
		await db.exec('BEGIN')

		for (const t of triples) {
			const sub_id = await this.upsertNode(t.subject, article_id)
			const obj_id = await this.upsertNode(t.object, article_id)

			await db.query(
				`
        INSERT INTO brain.edges (source_id, target_id, weight, type, learning_rate, decay_resistance)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING;
      `,
				[sub_id, obj_id, 0.5 * t.learning_rate, t.predicate, t.learning_rate, t.decay_resistance]
			)

			await db.query(
				`
        UPDATE brain.edges 
        SET 
          learning_rate = GREATEST(learning_rate, $3),
          decay_resistance = GREATEST(decay_resistance, $4),
          weight = LEAST(weight + (0.5 * $3), 5.0) 
        WHERE source_id = $1 AND target_id = $2;
      `,
				[sub_id, obj_id, t.learning_rate, t.decay_resistance]
			)
		}

		await db.exec('COMMIT')
	}

	private async upsertNode(label: string, article_id: number): Promise<number> {
		const db = (this.poly as any).db
		await db.query(
			`
      INSERT INTO brain.nodes (label, x, y, potential)
      VALUES ($1, random() * 800, random() * 600, 1.0)
      ON CONFLICT (label) DO UPDATE SET potential = brain.nodes.potential + 0.5;
    `,
			[label]
		)

		const res = await db.query('SELECT id FROM brain.nodes WHERE label = $1', [label])
		const nid = res.rows[0].id

		await db.query(
			'INSERT INTO brain.node_sources (node_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;',
			[nid, article_id]
		)

		return nid
	}
}
