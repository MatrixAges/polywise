export interface ProcessTestCase {
	query: string
	cot_depth: number
	expected_events: Array<string>
	expected_knowledges_keywords: Array<string>
}

export const process_test_cases: Array<ProcessTestCase> = [
	{
		query: 'What is the role of the hippocampus in memory?',
		cot_depth: 0,
		expected_events: ['aggregated_results', 'reranked_knowledges', 'reranked_actions', 'final_result'],
		expected_knowledges_keywords: ['hippocampus', 'memory', 'spatial navigation']
	},
	{
		query: 'How do neurons communicate and form networks?',
		cot_depth: 1,
		expected_events: [
			'aggregated_results',
			'reranked_knowledges',
			'reranked_actions',
			'planning_step',
			'final_result'
		],
		expected_knowledges_keywords: ['neurons', 'synapses', 'neural networks']
	}
]
