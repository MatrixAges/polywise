import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { getTestRerank, getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe('Memory Recall Debug - Issue: "记忆机制" returns empty', () => {
	let poly: Polywise
	const db_name = getDataDir()

	const metrics_ids = ['test_metrics_001']

	const architecture_content = `我已经详细分析过 packages/polywise 的项目架构，以下是核心要点：
	
## 1. 项目定位
神经科学启发的知识图谱与记忆系统，模拟人类记忆的形成、巩固和遗忘机制。

## 2. 核心机制

### 记忆召回
关键词匹配 → 关联节点扩散 → 刺激激活 → 强化边权重

### 记忆巩固
睡眠时整合记忆，Shadow Tick + Sleep Tick

## 3. 疲劳状态机
FRESH → TIRED → SLEEPING → FRESH 状态循环`

	beforeAll(async () => {
		poly = new Polywise()
		await poly.init({
			data_dir: db_name,
			embedding_config: { type: 'custom', fn: getTestVectors },
			reranker_config: { type: 'custom', fn: getTestRerank },
			metrics_ids
		})

		await poly.save({
			content: architecture_content,
			metrics_ids
		})
		console.log('✓ Content saved, id: 1')
	}, 60000)

	afterAll(async () => {
		await poly.off()
	})

	describe('Step 1: Verify storage', () => {
		it('should have stored articles with metrics_id', async () => {
			const articles = await poly.article.getAll()
			console.log('Articles count:', articles.length)
			expect(articles.length).toBeGreaterThan(0)
		})
	})

	describe('Step 2: Debug with full query API (idol_id, root_ids, metrics_ids)', () => {
		it('should query with different thresholds', async () => {
			for (const th of [1, 0.8, 0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.2, 0.1, 0.05, 0.0]) {
				const { knowledges } = await poly.query({
					query: '记忆机制',
					threshold: th,
					search_limit: 10,
					metrics_ids
				})
				console.log(`threshold=${th}: ${JSON.stringify(knowledges)}`)
			}
		})

		it('should query with wrong metrics_ids (should return empty)', async () => {
			const { knowledges } = await poly.query({
				query: '记忆机制',
				threshold: 0.0,
				search_limit: 10,
				metrics_ids: ['wrong_metrics_id']
			})
			console.log('Query with wrong metrics_ids:', knowledges.length)
		})
	})
})
