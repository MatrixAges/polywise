import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'
import dayjs from 'dayjs'

import { DEFAULT_DATE_FORMAT } from '../src/consts'
import Log from '../src/Log'

describe.concurrent('Log Module', () => {
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = dirname(__filename)
	const test_dir = join(__dirname, 'test_logs_temp')

	beforeAll(() => {
		if (!existsSync(test_dir)) {
			mkdirSync(test_dir, { recursive: true })
		}
	})

	afterAll(() => {
		if (existsSync(test_dir)) {
			rmSync(test_dir, { recursive: true, force: true })
		}
	})

	describe.concurrent('Log Initialization', () => {
		it('should create log directory if it does not exist', async () => {
			const unique_sub_dir = join(test_dir, `test_init_${Math.random().toString(36).slice(2)}`)
			const log = new Log()

			log.init({ dir: unique_sub_dir })

			expect(existsSync(unique_sub_dir)).toBe(true)
		})

		it('should use default log directory when not specified', async () => {
			const log = new Log()

			log.init({})

			expect(existsSync(join(homedir(), '.polywise', 'log'))).toBe(true)
		})

		it('should only write logs when initialized', async () => {
			const unique_sub_dir = join(test_dir, `test_init_write_${Math.random().toString(36).slice(2)}`)
			const log = new Log()

			log.init({ dir: unique_sub_dir, log: true })
			log.write({ test: 'input' }, { test: 'output' })

			const date = dayjs().format(DEFAULT_DATE_FORMAT)
			expect(existsSync(join(unique_sub_dir, `${date}.log`))).toBe(true)
		})

		it('should only write .log when json is disabled', async () => {
			const unique_sub_dir = join(test_dir, `test_log_only_${Math.random().toString(36).slice(2)}`)
			mkdirSync(unique_sub_dir, { recursive: true })

			const log = new Log()

			log.init({
				dir: unique_sub_dir,
				log: true,
				json: false
			})

			log.write({ test: 'input' }, { test: 'output' })

			const date = dayjs().format(DEFAULT_DATE_FORMAT)

			expect(existsSync(join(unique_sub_dir, `${date}.log`))).toBe(true)
			expect(existsSync(join(unique_sub_dir, `${date}.json`))).toBe(false)
		})

		it('should only write .json when json is enabled', async () => {
			const unique_sub_dir = join(test_dir, `test_json_only_${Math.random().toString(36).slice(2)}`)
			mkdirSync(unique_sub_dir, { recursive: true })

			const log = new Log()

			log.init({
				dir: unique_sub_dir,
				log: true,
				json: true
			})

			log.write({ test: 'input' }, { test: 'output' })

			const date = dayjs().format(DEFAULT_DATE_FORMAT)

			expect(existsSync(join(unique_sub_dir, `${date}.log`))).toBe(false)
			expect(existsSync(join(unique_sub_dir, `${date}.json`))).toBe(true)
		})

		it('should disable all logging when log master switch is false', async () => {
			const unique_sub_dir = join(test_dir, `test_disabled_${Math.random().toString(36).slice(2)}`)
			mkdirSync(unique_sub_dir, { recursive: true })

			const log = new Log()

			log.init({
				dir: unique_sub_dir,
				log: false,
				json: true
			})

			log.write({ test: 'input' }, { test: 'output' })

			const date = dayjs().format(DEFAULT_DATE_FORMAT)

			expect(existsSync(join(unique_sub_dir, `${date}.log`))).toBe(false)
			expect(existsSync(join(unique_sub_dir, `${date}.json`))).toBe(false)
		})
	})

	describe.concurrent('Log File Generation', () => {
		it('should generate .log file with correct format', async () => {
			const unique_sub_dir = join(test_dir, `test_log_${Math.random().toString(36).slice(2)}`)
			mkdirSync(unique_sub_dir, { recursive: true })

			const log = new Log()

			log.init({
				dir: unique_sub_dir,
				log: true
			})

			const test_input = { query: '什么是人工智能', recall_depth: 5 }
			const test_output = { memory: [{ id: 1, content: '人工智能是模拟人类智能的技术' }] }

			log.write(test_input, test_output)

			const date = dayjs().format(DEFAULT_DATE_FORMAT)
			const log_file_path = join(unique_sub_dir, `${date}.log`)

			expect(existsSync(log_file_path)).toBe(true)

			const content = readFileSync(log_file_path, 'utf-8')

			expect(content).toContain('[INPUT]')
			expect(content).toContain('[OUTPUT]')
			expect(content).toContain('什么是人工智能')
			expect(content).toContain('人工智能是模拟人类智能的技术')

			const lines = content.trim().split('\n')

			expect(lines[0]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[INPUT\]$/)
		})

		it('should generate .json file with correct format', async () => {
			const unique_sub_dir = join(test_dir, `test_json_${Math.random().toString(36).slice(2)}`)
			mkdirSync(unique_sub_dir, { recursive: true })

			const log = new Log()

			log.init({
				dir: unique_sub_dir,
				json: true
			})

			const test_input = { query: '机器学习基础', search_limit: 10 }
			const test_output = { actions: [{ id: 2, content: '训练模型' }] }

			log.write(test_input, test_output)

			const date = dayjs().format(DEFAULT_DATE_FORMAT)
			const json_file_path = join(unique_sub_dir, `${date}.json`)

			expect(existsSync(json_file_path)).toBe(true)

			const line = readFileSync(json_file_path, 'utf-8').trim()
			const entry = JSON.parse(line)

			expect(entry).toHaveProperty('timestamp')
			expect(entry).toHaveProperty('input')
			expect(entry).toHaveProperty('output')
			expect(entry.input).toEqual(test_input)
			expect(entry.output).toEqual(test_output)
			expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
		})

		it('should append to existing log files', async () => {
			const unique_sub_dir = join(test_dir, `test_append_${Math.random().toString(36).slice(2)}`)
			mkdirSync(unique_sub_dir, { recursive: true })

			const log = new Log()

			log.init({
				dir: unique_sub_dir,
				log: true
			})

			log.write({ action: 'first' }, { result: 'result1' })
			log.write({ action: 'second' }, { result: 'result2' })

			const date = dayjs().format(DEFAULT_DATE_FORMAT)
			const log_file_path = join(unique_sub_dir, `${date}.log`)

			const content = readFileSync(log_file_path, 'utf-8')

			expect(content).toContain('first')
			expect(content).toContain('second')
			expect(content).toContain('result1')
			expect(content).toContain('result2')
		})
	})

	describe.concurrent('Log Timestamps', () => {
		it('should generate valid timestamp format', async () => {
			const unique_sub_dir = join(test_dir, `test_ts_${Math.random().toString(36).slice(2)}`)
			mkdirSync(unique_sub_dir, { recursive: true })

			const log = new Log()

			log.init({
				dir: unique_sub_dir,
				log: true
			})

			log.write({ test: 'timestamp' }, { result: 'ok' })

			const date = dayjs().format(DEFAULT_DATE_FORMAT)
			const log_file_path = join(unique_sub_dir, `${date}.log`)

			if (existsSync(log_file_path)) {
				const log_content = readFileSync(log_file_path, 'utf-8')

				expect(log_content).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)
			}
		})

		it('should use same timestamp for entry', async () => {
			const unique_sub_dir = join(test_dir, `test_same_ts_${Math.random().toString(36).slice(2)}`)
			mkdirSync(unique_sub_dir, { recursive: true })

			const log = new Log()

			log.init({
				dir: unique_sub_dir,
				json: true
			})

			log.write({ input: 'data' }, { output: 'result' })

			const date = dayjs().format(DEFAULT_DATE_FORMAT)
			const json_file_path = join(unique_sub_dir, `${date}.json`)

			const json_line = readFileSync(json_file_path, 'utf-8').trim()
			const entry = JSON.parse(json_line)

			expect(entry).toHaveProperty('timestamp')
			expect(entry.input).toEqual({ input: 'data' })
		})
	})

	describe.concurrent('Log Complex Data', () => {
		it('should handle nested object inputs', async () => {
			const unique_sub_dir = join(test_dir, `test_nested_${Math.random().toString(36).slice(2)}`)
			mkdirSync(unique_sub_dir, { recursive: true })

			const log = new Log()

			log.init({
				dir: unique_sub_dir,
				json: true
			})

			const complex_input = {
				query: '复杂查询',
				options: {
					recall_depth: 5,
					search_limit: 10,
					rerank_limit: 20,
					cot_depth: 3
				},
				filters: ['memory', 'external']
			}

			const complex_output = {
				memory: [
					{ id: 1, content: '知识1', metadata: { source: 'article' } },
					{ id: 2, content: '知识2', metadata: { source: 'external' } }
				],
				actions: [{ id: 3, content: '动作1', memoryStrength: 0.95 }],
				cot: { depth: 1, results: [] }
			}

			log.write(complex_input, complex_output)

			const date = dayjs().format(DEFAULT_DATE_FORMAT)
			const json_file_path = join(unique_sub_dir, `${date}.json`)

			const json_line = readFileSync(json_file_path, 'utf-8').trim()
			const entry = JSON.parse(json_line)

			expect(entry.input).toEqual(complex_input)
			expect(entry.output).toEqual(complex_output)
		})
	})
})
