#!/usr/bin/env bun
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createSerializer } from '@jlarky/gha-ts/render'
import { workflow } from '@jlarky/gha-ts/workflow-types'
import { YAML } from 'bun'

const current_dir = dirname(fileURLToPath(import.meta.url))

const readPnpmVersion = () => {
	const package_json = JSON.parse(readFileSync(resolve(current_dir, '../../package.json'), 'utf8'))
	const package_manager = package_json?.packageManager

	if (typeof package_manager !== 'string') {
		throw new Error('packageManager is missing in root package.json')
	}

	const match = package_manager.match(/^pnpm@(.+)$/)

	if (!match?.[1]) {
		throw new Error(`Unsupported packageManager: ${package_manager}`)
	}

	return match[1]
}

const pnpm_version = readPnpmVersion()

const workflow_definition = workflow({
	name: 'Deploy Website',
	on: {
		workflow_dispatch: {}
	},
	concurrency: {
		group: 'website-deploy-${{ github.ref_name }}',
		'cancel-in-progress': true
	},
	permissions: {
		contents: 'read'
	},
	jobs: {
		deploy: {
			'runs-on': 'ubuntu-latest',
			steps: [
				{
					uses: 'actions/checkout@v6',
					with: {
						'fetch-depth': 0
					}
				},
				{
					name: 'Setup pnpm',
					uses: 'pnpm/action-setup@v6',
					with: {
						version: pnpm_version,
						run_install: false
					}
				},
				{
					uses: 'actions/setup-node@v6',
					with: {
						'node-version': 'lts/*',
						cache: 'pnpm',
						'cache-dependency-path': 'pnpm-lock.yaml'
					}
				},
				{
					name: 'Install dependencies',
					run: 'pnpm --filter website... install --frozen-lockfile'
				},
				{
					name: 'Validate Cloudflare secrets',
					shell: 'bash',
					env: {
						CLOUDFLARE_ACCOUNT_ID: '${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
						CLOUDFLARE_API_TOKEN: '${{ secrets.WEBSITE_API_TOKEN }}'
					},
					run: ['[ -n "$CLOUDFLARE_API_TOKEN" ]', '[ -n "$CLOUDFLARE_ACCOUNT_ID" ]'].join('\n')
				},
				{
					name: 'Deploy website',
					shell: 'bash',
					env: {
						CI: 'true',
						CLOUDFLARE_ACCOUNT_ID: '${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
						CLOUDFLARE_API_TOKEN: '${{ secrets.WEBSITE_API_TOKEN }}'
					},
					run: 'pnpm --dir packages/website run deploy'
				}
			]
		}
	}
})

const output_path = resolve(current_dir, '../workflows/website.generated.yml')

createSerializer(workflow_definition, YAML.stringify).writeWorkflow(output_path)
