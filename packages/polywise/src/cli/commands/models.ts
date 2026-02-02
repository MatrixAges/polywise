import { Command } from 'commander'

import { formatProgress, formatSize, formatSpeed } from '../../utils'

import type { ModelDownloadProgress } from '../../types/model'

export function createModelsCommand(): Command {
	const command = new Command('models')

	command
		.command('list')
		.description('List all local models')
		.action(async () => {
			const { default: ModelManager } = await import('../../ModelManager')
			const mm = new ModelManager()
			await mm.init()

			const models = await mm.listModels()

			if (models.length === 0) {
				console.log('No local models found.')
				return
			}

			console.log('\nLocal Models:')
			console.log('─'.repeat(80))

			for (const model of models) {
				const statusIcon =
					model.status === 'available'
						? '✓'
						: model.status === 'downloading'
							? '⏳'
							: model.status === 'incomplete'
								? '⚠'
								: '✗'
				console.log(`${statusIcon} ${model.name}`)
				console.log(`   Status: ${model.status}`)
				console.log(`   Size: ${formatSize(model.size)}`)
				console.log(`   Path: ${model.path}`)
				if (model.last_checked) {
					console.log(`   Last checked: ${new Date(model.last_checked).toLocaleString()}`)
				}
				if (model.error) {
					console.log(`   Error: ${model.error}`)
				}
				console.log('')
			}

			mm.off()
		})

	command
		.command('download <model_id>')
		.description('Download a model from HuggingFace Hub')
		.option('--dtype <dtype>', 'Data type (q8, f16, f32)', 'q8')
		.option('--revision <revision>', 'Model revision', 'main')
		.action(async (modelId: string, options: { dtype?: string; revision?: string }) => {
			const { default: ModelManager } = await import('../../ModelManager')
			const mm = new ModelManager()
			await mm.init()

			console.log(`Downloading model: ${modelId}`)
			console.log(`Data type: ${options.dtype || 'q8'}`)
			console.log(`Revision: ${options.revision || 'main'}`)
			console.log('')

			let progress: ModelDownloadProgress | null = null
			const progressInterval = setInterval(async () => {
				progress = await mm.getDownloadProgress(modelId)
				if (progress && progress.status === 'downloading') {
					const progressStr = formatProgress(progress.downloaded, progress.total)
					const speedStr = formatSpeed(progress.speed)
					process.stdout.write(`\r${progressStr} | ${speedStr}     `)
				}
			}, 500)

			try {
				const model = await mm.downloadModel(modelId, {
					dtype: options.dtype,
					revision: options.revision
				})

				clearInterval(progressInterval)
				process.stdout.write('\r' + ' '.repeat(50) + '\r')

				console.log('\n✓ Download completed!')
				console.log(`   Model: ${model.name}`)
				console.log(`   Size: ${formatSize(model.size)}`)
				console.log(`   Path: ${model.path}`)
			} catch (error) {
				clearInterval(progressInterval)
				process.stdout.write('\r' + ' '.repeat(50) + '\r')
				console.error('\n✗ Download failed:', error instanceof Error ? error.message : String(error))
				process.exit(1)
			} finally {
				mm.off()
			}
		})

	command
		.command('delete <model_id>')
		.description('Delete a local model')
		.action(async (modelId: string) => {
			const { default: ModelManager } = await import('../../ModelManager')
			const mm = new ModelManager()
			await mm.init()

			const model = await mm.getModel(modelId)
			if (!model) {
				console.error(`Model "${modelId}" not found.`)
				mm.off()
				process.exit(1)
			}

			const deleted = await mm.deleteModel(modelId)

			if (deleted) {
				console.log(`✓ Model "${modelId}" deleted successfully.`)
			} else {
				console.error(`✗ Failed to delete model "${modelId}".`)
				process.exit(1)
			}

			mm.off()
		})

	command
		.command('status <model_id>')
		.description('Get model status')
		.action(async (modelId: string) => {
			const { default: ModelManager } = await import('../../ModelManager')
			const mm = new ModelManager()
			await mm.init()

			const model = await mm.refreshModelStatus(modelId)

			console.log('\nModel Status:')
			console.log('─'.repeat(80))
			console.log(`Name: ${model.name}`)
			console.log(`Status: ${model.status}`)
			console.log(`Size: ${formatSize(model.size)}`)
			console.log(`Path: ${model.path}`)
			if (model.last_checked) {
				console.log(`Last checked: ${new Date(model.last_checked).toLocaleString()}`)
			}
			if (model.dtype) {
				console.log(`Data type: ${model.dtype}`)
			}
			if (model.error) {
				console.log(`Error: ${model.error}`)
			}

			const progress = await mm.getDownloadProgress(modelId)
			if (progress && progress.status === 'downloading') {
				console.log('')
				console.log('Download Progress:')
				console.log(`Downloaded: ${formatProgress(progress.downloaded, progress.total)}`)
				console.log(`Speed: ${formatSpeed(progress.speed)}`)
			}

			mm.off()
		})

	command
		.command('verify <model_id>')
		.description('Verify model integrity')
		.action(async (modelId: string) => {
			const { default: ModelManager } = await import('../../ModelManager')
			const mm = new ModelManager()
			await mm.init()

			const model = await mm.verifyModel完整性(modelId)

			console.log('\nModel Verification:')
			console.log('─'.repeat(80))
			console.log(`Name: ${model.name}`)
			console.log(`Status: ${model.status}`)

			if (model.status === 'available') {
				console.log('✓ Model is valid and ready to use.')
			} else if (model.status === 'incomplete') {
				console.log('⚠ Model is incomplete or corrupted.')
				console.log(`   Run "polywise models download ${modelId}" to re-download.`)
			} else {
				console.log('✗ Model has errors.')
				if (model.error) {
					console.log(`   Error: ${model.error}`)
				}
			}

			mm.off()
		})

	return command
}
