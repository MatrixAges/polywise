import Polywise from '../src/Polywise'
import { getTestKeywords, getTestRerank, getTestVectors } from './utils/getCache'

async function main() {
	const db_path = process.env.POLYWISE_DB_PATH || '/Users/xiewendao/.polywise/:polywise:'

	console.log('=== Debug Snapshot Test ===')
	console.log('Using database:', db_path)

	const poly = new Polywise()

	try {
		await poly.init({
			data_dir: db_path,
			embedding_config: {
				type: 'custom',
				fn: getTestVectors
			},
			reranker_config: {
				type: 'custom',
				fn: getTestRerank
			},
			keyword_config: {
				type: 'custom',
				fn: getTestKeywords
			}
		})

		console.log('Polywise initialized successfully')

		// Test getSnapshot
		console.log('\n--- Testing getSnapshot ---')
		const snapshot = await poly.getSnapshot(0.2, 60)
		console.log('Snapshot result:', {
			node_count: snapshot.nodes.length,
			edge_count: snapshot.edges.length
		})

		// Test getAllNodes
		console.log('\n--- Testing getAllNodes ---')
		const all_nodes = await poly.getAllNodes()
		console.log('All nodes count:', all_nodes.length)

		// Test simple query
		console.log('\n--- Testing simple query ---')
		const simple_sql = 'SELECT COUNT(*) as count FROM brain.nodes'
		const count_result = await poly.queryRaw(simple_sql)
		console.log('Node count from SQL:', count_result)

		console.log('\n=== All tests passed ===')
	} catch (error) {
		console.error('\n!!! Error occurred !!!')
		console.error('Error:', error instanceof Error ? error.message : String(error))
		console.error('Stack:', error instanceof Error ? error.stack : undefined)
	} finally {
		await poly.off()
		process.exit(0)
	}
}

main()
