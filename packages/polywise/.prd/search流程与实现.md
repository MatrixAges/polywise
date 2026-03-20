新增 rpc/search接口 输入为query（string），intent（string）,rank_by_time（可选，rerank前是否执行基于更新时间的加权排序），return_article（可选，如果开启，则返回的是article，最多3篇）包含以下流程：

return值有两种类型 type:'chunk'|'article' chunk最多有6条

1. getSearchTarget 查询重写
2. searchByKeywords
3. searchByVector
4. lookup 用查询到的 chunk获取对应的article，并去重
5. Eval加权重排序
6. prerank 根据rank_by_time可选，r执行基于更新时间的加权排序
7. rerank

每个过程都用单独的文件函数表示

## getSearchTarget

根据query intend 调用 gen model 重写查询
具体 prompt 结构如下（见 src/llm.ts）： const prompt = intent
? `Expand this search query: ${query}\nQuery intent: ${intent}`
: `Expand this search query: ${query}`;
调用gen model重写搜索请求内容：
keywords: ...（关键词）
question: ...（语义短语）
answer: ...（假设性结果片段）
关键词用于全文检索，question和answer用于向量检索

## Eval加权重排序

### 1\. 模拟场景与查询数据

假设用户的原始查询是关于前端性能优化的：

- **用户输入**: `"React useEffect 导致无限循环怎么解决？"`
  系统在底层会将这个输入扩展并分别路由到三个不同的检索引擎：
- **维度一：Keywords (关键词全文检索 - BM25)**
     - _提取特征_: `React`, `useEffect`, `无限循环`, `解决`
     - _权重_: 2x
     - _返回列表_: `[Doc_A (Rank 1), Doc_C (Rank 2), Doc_D (Rank 3), Doc_E (Rank 4)]`
- **维度二：Question (语义短语向量检索 - Dense Vector)**
     - _提取特征_: `"React useEffect 导致无限循环怎么解决？"` (Embedding)
     - _权重_: 2x
     - _返回列表_: `[Doc_B (Rank 1), Doc_A (Rank 2), Doc_F (Rank 3), Doc_C (Rank 4)]`
- **维度三：Answer (假设性答案向量检索 - HyDE)**
     - _提取特征_: `"要解决 React useEffect 的无限循环，你需要检查依赖数组 (dependency array) 是否包含了每次渲染都会改变的引用类型变量..."` (Embedding)
     - _权重_: 1x
     - _返回列表_: `[Doc_C (Rank 1), Doc_B (Rank 2), Doc_G (Rank 3), Doc_A (Rank 4)]`

---

### 2\. TypeScript 排序代码实现

下面是针对上述逻辑的 TS 具体实现。代码包含了 RRF 得分计算、分数归一化（为了与重排模型的分数对齐），以及动态加权策略。

```typescript
// 1. 定义基础数据结构
interface SearchResult {
	docId: string
	rank: number
}
interface RrfScore {
	docId: string
	rrfScore: number
	normalizedRrfScore?: number
	rrfRank: number // 融合后的排名，用于触发动态加权
}
interface FinalScoredDoc extends RrfScore {
	rerankerScore: number
	finalScore: number
}
// 模拟的查询结果数据
const keywordsResults: SearchResult[] = [
	{ docId: 'Doc_A', rank: 1 },
	{ docId: 'Doc_C', rank: 2 },
	{ docId: 'Doc_D', rank: 3 },
	{ docId: 'Doc_E', rank: 4 }
]
const questionResults: SearchResult[] = [
	{ docId: 'Doc_B', rank: 1 },
	{ docId: 'Doc_A', rank: 2 },
	{ docId: 'Doc_F', rank: 3 },
	{ docId: 'Doc_C', rank: 4 }
]
const answerResults: SearchResult[] = [
	{ docId: 'Doc_C', rank: 1 },
	{ docId: 'Doc_B', rank: 2 },
	{ docId: 'Doc_G', rank: 3 },
	{ docId: 'Doc_A', rank: 4 }
]
/**
 * 2. RRF 加权融合排序 (Reciprocal Rank Fusion)
 */
function calculateWeightedRRF(
	kwList: SearchResult[],
	qList: SearchResult[],
	ansList: SearchResult[],
	k: number = 60 // RRF 平滑常数，业界通常设为 60
): RrfScore[] {
	const scoreMap = new Map<string, number>()
	// 计算 RRF 分数的辅助函数，引入了我们在架构中定义的权重
	const applyRRF = (list: SearchResult[], weight: number) => {
		list.forEach(item => {
			const currentScore = scoreMap.get(item.docId) || 0
			// RRF 公式: Weight * (1 / (k + Rank))
			const additionalScore = weight * (1 / (k + item.rank))
			scoreMap.set(item.docId, currentScore + additionalScore)
		})
	}
	// 按照 qmd 的策略分配权重：Keywords 和 Question 是 2x，Answer 是 1x
	applyRRF(kwList, 2)
	applyRRF(qList, 2)
	applyRRF(ansList, 1)
	// 转换为数组并按 RRF 分数降序排列
	const sortedRRF = Array.from(scoreMap.entries())
		.map(([docId, rrfScore]) => ({ docId, rrfScore }))
		.sort((a, b) => b.rrfScore - a.rrfScore)
	// 获取最高分用于归一化 (将分数映射到 0-1 区间，方便后续与 Reranker 分数融合)
	const maxRrfScore = sortedRRF[0]?.rrfScore || 1
	return sortedRRF.map((item, index) => ({
		docId: item.docId,
		rrfScore: item.rrfScore,
		normalizedRrfScore: item.rrfScore / maxRrfScore, // 归一化
		rrfRank: index + 1 // 记录融合后的排位
	}))
}
/**
 * 3. 模拟一个 Cross-Encoder 重排模型打分 (0 到 1 之间)
 */
async function fetchRerankerScore(query: string, docId: string): Promise<number> {
	// 在真实环境中，这里会调用 BGE-Reranker 或 Cohere Rerank API
	// 这里我们用伪随机数模拟重排模型给出的语义匹配度得分
	const mockScores: Record<string, number> = {
		Doc_A: 0.85,
		Doc_B: 0.92,
		Doc_C: 0.78,
		Doc_D: 0.45,
		Doc_E: 0.3,
		Doc_F: 0.6,
		Doc_G: 0.88
	}
	return mockScores[docId] || Math.random()
}
/**
 * 4. 位置感知动态加权重排 (Position-Aware Blending)
 */
async function dynamicReRanking(query: string, rrfResults: RrfScore[]): Promise<FinalScoredDoc[]> {
	const finalResults: FinalScoredDoc[] = []
	for (const doc of rrfResults) {
		const rerankScore = await fetchRerankerScore(query, doc.docId)
		let finalScore = 0
		const retrievalScore = doc.normalizedRrfScore!
		// 根据 RRF 的初始排位，动态调整检索分和重排分的权重比例
		if (doc.rrfRank >= 1 && doc.rrfRank <= 3) {
			// Top 1-3: 信任多路召回的精确度，检索分占主导 (75%)
			finalScore = 0.75 * retrievalScore + 0.25 * rerankScore
		} else if (doc.rrfRank >= 4 && doc.rrfRank <= 10) {
			// Mid 4-10: 适度增加语义重排的话语权 (40%)
			finalScore = 0.6 * retrievalScore + 0.4 * rerankScore
		} else {
			// Bottom 11+: 缺乏精确匹配，高度信任重排模型的深层语义能力 (60%)
			finalScore = 0.4 * retrievalScore + 0.6 * rerankScore
		}
		finalResults.push({
			...doc,
			rerankerScore: rerankScore,
			finalScore: finalScore
		})
	}
	// 最终按动态加权后的 finalScore 重新排序
	return finalResults.sort((a, b) => b.finalScore - a.finalScore)
}
/**
 * 5. 执行主流水线
 */
async function runSearchPipeline() {
	const query = 'React useEffect 导致无限循环怎么解决？'
	// 第一步：执行 RRF 融合
	const rrfResults = calculateWeightedRRF(keywordsResults, questionResults, answerResults)
	console.log('--- 阶段一：RRF 融合与归一化结果 ---')
	console.table(rrfResults)
	// 第二步：执行动态加权重排
	const finalRankedDocs = await dynamicReRanking(query, rrfResults)
	console.log('--- 阶段二：位置感知动态重排最终结果 ---')
	console.table(
		finalRankedDocs.map(d => ({
			Doc: d.docId,
			RRF_Rank: d.rrfRank,
			Retrieval_Score: d.normalizedRrfScore?.toFixed(3),
			Reranker_Score: d.rerankerScore.toFixed(3),
			Final_Score: d.finalScore.toFixed(3)
		}))
	)
}
runSearchPipeline()
```

### 核心逻辑解析

1.    **`calculateWeightedRRF` 函数**：这里完美体现了针对不同输入源的降维打击。BM25 和 Vector 分数单位不同，但通过 `1 / (k + rank)` 转化为了统一的位置衰减得分。然后直接在累加时乘上了我们预设的 `weight`（2 或 1）。
2.    **归一化处理 (`normalizedRrfScore`)**：这是工程实现中极易被忽略的一步。RRF 算出来的值通常非常小（例如 0.03），如果不进行 `score / maxScore` 的归一化，在后续与重排模型（通常输出 0-1 的概率值）进行线性相加时，RRF 分数会被彻底淹没，导致加权失效。
3.    **`dynamicReRanking` 函数**：这里的 `if/else` 块就是位置感知（Position-Aware）的灵魂。排在最前面的文档受到了“保护”（享有 0.75 的检索系数），即使重排模型偶尔犯傻给了低分，它们也不会轻易掉出第一梯队。
