export interface ProcessTestCase {
	query: string
	cot_depth: number
	expected_events: Array<string>
	expected_memory_keywords: Array<string>
}

export const process_test_cases: Array<ProcessTestCase> = [
	{
		query: 'What is the role of the hippocampus in memory?',
		cot_depth: 0,
		expected_events: ['aggregated_results', 'reranked_memory', 'final_result'],
		expected_memory_keywords: ['hippocampus', 'memory', 'spatial navigation']
	},
	{
		query: 'How do neurons communicate and form networks?',
		cot_depth: 1,
		expected_events: ['aggregated_results', 'reranked_memory', 'final_result'],
		expected_memory_keywords: ['neurons', 'synapses', 'neural networks']
	}
]
