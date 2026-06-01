#!/usr/bin/env bun
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { checkout, setupNode } from '@jlarky/gha-ts/actions'
import { createSerializer } from '@jlarky/gha-ts/render'
import { workflow } from '@jlarky/gha-ts/workflow-types'
import { YAML } from 'bun'

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
				checkout({
					'fetch-depth': 0
				}),
				{
					name: 'Setup pnpm',
					uses: 'pnpm/action-setup@v4',
					with: {
						run_install: false
					}
				},
				setupNode({
					'node-version': 'lts/*',
					cache: 'pnpm',
					'cache-dependency-path': 'pnpm-lock.yaml'
				}),
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

const current_dir = dirname(fileURLToPath(import.meta.url))
const output_path = resolve(current_dir, '../workflows/website.generated.yml')

createSerializer(workflow_definition, YAML.stringify).writeWorkflow(output_path)
