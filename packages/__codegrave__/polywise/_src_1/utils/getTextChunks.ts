import { RecursiveChunker, Tokenizer } from '@chonkiejs/core'

type SegmentByTokenOptions = {
	max_segment_tokens?: number
	overlap_tokens?: number
	measure_concurrency?: number
	cache_limit?: number
}

type TokenMeasuredPart = {
	text: string
	token_count: number
}

type LruNode = {
	key: string
	value: number
	prev: LruNode | null
	next: LruNode | null
}

class LruTokenCache {
	private limit: number
	private map: Map<string, LruNode>
	private head: LruNode | null
	private tail: LruNode | null

	constructor(limit: number) {
		this.limit = Math.max(100, limit)
		this.map = new Map()
		this.head = null
		this.tail = null
	}

	get(key: string) {
		const node = this.map.get(key)

		if (!node) return undefined

		this.moveToHead(node)

		return node.value
	}

	set(key: string, value: number) {
		const existed = this.map.get(key)

		if (existed) {
			existed.value = value

			this.moveToHead(existed)

			return
		}

		const node: LruNode = { key, value, prev: null, next: null }

		this.map.set(key, node)

		this.addToHead(node)

		if (this.map.size <= this.limit) return

		this.evictTail()
	}

	private addToHead(node: LruNode) {
		node.prev = null
		node.next = this.head

		if (this.head) this.head.prev = node

		this.head = node

		if (!this.tail) this.tail = node
	}

	private moveToHead(node: LruNode) {
		if (this.head === node) return

		if (node.prev) node.prev.next = node.next
		if (node.next) node.next.prev = node.prev
		if (this.tail === node) this.tail = node.prev

		node.prev = null
		node.next = this.head

		if (this.head) this.head.prev = node

		this.head = node
	}

	private evictTail() {
		if (!this.tail) return

		const key = this.tail.key
		const prev = this.tail.prev

		if (prev) prev.next = null

		this.tail = prev

		if (!this.tail) this.head = null

		this.map.delete(key)
	}
}

const splitByNaturalUnits = (text: string) => {
	const paragraphs = text.split('\n\n')
	const units: string[] = []

	for (const paragraph of paragraphs) {
		const trimmed_paragraph = paragraph.trim()

		if (!trimmed_paragraph) continue

		const lines = trimmed_paragraph
			.split('\n')
			.map(line => line.trim())
			.filter(Boolean)

		if (lines.length <= 1) {
			units.push(trimmed_paragraph)

			continue
		}

		for (const line of lines) units.push(line)
	}

	return units
}

const runWithConcurrency = async <T, R>(
	items: T[],
	concurrency: number,
	worker: (item: T, index: number) => Promise<R>
) => {
	const safe_concurrency = Math.max(1, concurrency)
	const results: R[] = new Array(items.length)
	let current_index = 0

	const runWorker = async () => {
		while (true) {
			const index = current_index
			current_index += 1
			if (index >= items.length) return
			results[index] = await worker(items[index], index)
		}
	}

	const workers: Promise<void>[] = []

	for (let i = 0; i < safe_concurrency; i++) workers.push(runWorker())

	await Promise.all(workers)

	return results
}

const createTokenCounter = (tokenizer: Tokenizer, cache_limit: number) => {
	const token_cache = new LruTokenCache(cache_limit)

	const countTokens = async (text: string) => {
		const cached = token_cache.get(text)

		if (cached !== undefined) return cached

		const tokens = tokenizer.encode(text)
		const token_count = tokens.length

		token_cache.set(text, token_count)

		return token_count
	}

	return { countTokens }
}

const splitOversizeUnit = async (
	text: string,
	max_segment_tokens: number,
	countTokens: (text: string) => Promise<number>
) => {
	const pieces: string[] = []

	let remaining_text = text

	while (remaining_text.length > 0) {
		const total_tokens = await countTokens(remaining_text)

		if (total_tokens <= max_segment_tokens) {
			pieces.push(remaining_text)
			break
		}

		const ratio = max_segment_tokens / total_tokens
		const guess_chars = Math.max(500, Math.floor(remaining_text.length * ratio))
		let cut_index = Math.min(remaining_text.length, guess_chars)

		if (cut_index < remaining_text.length) {
			const nearest_break = remaining_text.lastIndexOf('\n', cut_index)
			if (nearest_break > 200) cut_index = nearest_break
		}

		const piece = remaining_text.slice(0, cut_index).trim()
		if (!piece) break

		pieces.push(piece)

		remaining_text = remaining_text.slice(cut_index).trim()
	}

	return pieces
}

const buildSegmentsByTokenBudget = async (text: string, tokenizer: Tokenizer, options?: SegmentByTokenOptions) => {
	const max_segment_tokens = options?.max_segment_tokens ?? 4000
	const overlap_tokens = options?.overlap_tokens ?? 200
	const measure_concurrency = options?.measure_concurrency ?? 8
	const cache_limit = options?.cache_limit ?? 20_000

	const units = splitByNaturalUnits(text)

	if (units.length === 0) return [text]

	const { countTokens } = createTokenCounter(tokenizer, cache_limit)

	const measured_units = await runWithConcurrency(units, measure_concurrency, async unit => {
		const token_count = await countTokens(unit)
		return { text: unit, token_count } as TokenMeasuredPart
	})

	const normalized_units: TokenMeasuredPart[] = []

	for (const unit of measured_units) {
		if (unit.token_count <= max_segment_tokens) {
			normalized_units.push(unit)
			continue
		}

		const pieces = await splitOversizeUnit(unit.text, max_segment_tokens, countTokens)

		for (const piece of pieces) {
			const token_count = await countTokens(piece)
			normalized_units.push({ text: piece, token_count })
		}
	}

	const raw_segments: string[] = []

	let current_text = ''
	let current_tokens = 0

	for (const unit of normalized_units) {
		const next_tokens = current_tokens + unit.token_count

		if (next_tokens <= max_segment_tokens) {
			current_text = current_text ? `${current_text}\n\n${unit.text}` : unit.text
			current_tokens = next_tokens

			continue
		}

		if (current_text) raw_segments.push(current_text)

		current_text = unit.text
		current_tokens = unit.token_count
	}

	if (current_text) raw_segments.push(current_text)

	if (raw_segments.length <= 1 || overlap_tokens <= 0) return raw_segments

	const final_segments: string[] = [raw_segments[0]]

	for (let i = 1; i < raw_segments.length; i++) {
		const prev_text = raw_segments[i - 1]
		const curr_text = raw_segments[i]

		const prev_tokens = tokenizer.encode(prev_text)
		const overlap_slice = prev_tokens.slice(Math.max(0, prev_tokens.length - overlap_tokens))
		const overlap_text = tokenizer.decode(overlap_slice)

		final_segments.push(`${overlap_text}${curr_text}`)
	}

	return final_segments
}

export default async (text: string) => {
	const byte_size = Buffer.byteLength(text, 'utf8')
	if (byte_size <= 90_000) return [text]

	const tokenizer = await Tokenizer.create('character')

	const segments = await buildSegmentsByTokenBudget(text, tokenizer, {
		max_segment_tokens: 4000,
		overlap_tokens: 200,
		measure_concurrency: 8,
		cache_limit: 20_000
	})

	const chunker = await RecursiveChunker.create({
		chunkSize: 2048,
		minCharactersPerChunk: 200,
		tokenizer
	})

	const final_chunks: string[] = []

	for (const segment of segments) {
		const chunks = await chunker.chunk(segment)

		final_chunks.push(...chunks.map(chunk => chunk.text))
	}

	return final_chunks
}
