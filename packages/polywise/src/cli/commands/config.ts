import path from 'path'
import { Command } from 'commander'
import fs from 'fs-extra'

interface Config {
	models_dir?: string
	embedding_model?: string
	reranker_model?: string
	embedding_dtype?: string
	reranker_dtype?: string
}

const CONFIG_FILE = 'polywise.config.json'

function getConfigPath(): string {
	return path.resolve(process.cwd(), CONFIG_FILE)
}

function loadConfig(): Config {
	const configPath = getConfigPath()
	if (fs.existsSync(configPath)) {
		return fs.readJsonSync(configPath)
	}
	return {}
}

function saveConfig(config: Config) {
	const configPath = getConfigPath()
	fs.writeJsonSync(configPath, config, { spaces: 2 })
}

export function createConfigCommand(): Command {
	const command = new Command('config')

	command
		.command('show')
		.description('Show current configuration')
		.action(() => {
			const config = loadConfig()

			console.log('\nPolywise Configuration:')
			console.log('─'.repeat(80))

			if (Object.keys(config).length === 0) {
				console.log('No configuration file found. Using defaults.')
				console.log('')
				console.log('Default settings:')
				console.log(`   Models directory: ${path.resolve(process.cwd(), 'models')}`)
				console.log(`   Embedding model: onnx-community/Qwen3-Embedding-0.6B-ONNX`)
				console.log(`   Reranker model: onnx-community/bge-reranker-v2-m3-ONNX`)
			} else {
				console.log(`Config file: ${getConfigPath()}`)
				console.log('')

				if (config.models_dir) {
					console.log(`Models directory: ${config.models_dir}`)
				}
				if (config.embedding_model) {
					console.log(`Embedding model: ${config.embedding_model}`)
				}
				if (config.reranker_model) {
					console.log(`Reranker model: ${config.reranker_model}`)
				}
				if (config.embedding_dtype) {
					console.log(`Embedding dtype: ${config.embedding_dtype}`)
				}
				if (config.reranker_dtype) {
					console.log(`Reranker dtype: ${config.reranker_dtype}`)
				}
			}

			console.log('')
		})

	command
		.command('set')
		.description('Set configuration value')
		.argument(
			'<key>',
			'Configuration key (models-dir, embedding-model, reranker-model, embedding-dtype, reranker-dtype)'
		)
		.argument('<value>', 'Configuration value')
		.action((key: string, value: string) => {
			const validKeys = [
				'models-dir',
				'embedding-model',
				'reranker-model',
				'embedding-dtype',
				'reranker-dtype'
			]

			if (!validKeys.includes(key)) {
				console.error(`Invalid configuration key: ${key}`)
				console.error(`Valid keys: ${validKeys.join(', ')}`)
				process.exit(1)
			}

			const config = loadConfig()

			const keyMap: Record<string, keyof Config> = {
				'models-dir': 'models_dir',
				'embedding-model': 'embedding_model',
				'reranker-model': 'reranker_model',
				'embedding-dtype': 'embedding_dtype',
				'reranker-dtype': 'reranker_dtype'
			}

			config[keyMap[key]] = value
			saveConfig(config)

			console.log(`✓ Configuration updated: ${key} = ${value}`)
		})

	command
		.command('reset')
		.description('Reset configuration to defaults')
		.action(() => {
			const configPath = getConfigPath()

			if (fs.existsSync(configPath)) {
				fs.removeSync(configPath)
				console.log('✓ Configuration reset to defaults.')
			} else {
				console.log('No configuration file to reset.')
			}
		})

	return command
}
