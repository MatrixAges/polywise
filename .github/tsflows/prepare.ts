#!/usr/bin/env bun
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { checkout, setupNode } from '@jlarky/gha-ts/actions'
import { createSerializer } from '@jlarky/gha-ts/render'
import { workflow } from '@jlarky/gha-ts/workflow-types'
import { YAML } from 'bun'

const workflow_definition = workflow({
	name: 'Prepare Release',
	on: {
		workflow_call: {
			inputs: {
				version_number: {
					required: false,
					type: 'string',
					description: 'Optional release version in *.*.* format.'
				}
			},
			outputs: {
				current_version: {
					description: 'Current version from packages/polywise/package.json',
					value: '${{ jobs.prepare.outputs.current_version }}'
				},
				release_version: {
					description: 'Resolved release version',
					value: '${{ jobs.prepare.outputs.release_version }}'
				},
				release_tag: {
					description: 'Resolved release tag',
					value: '${{ jobs.prepare.outputs.release_tag }}'
				},
				previous_tag: {
					description: 'Previous release tag',
					value: '${{ jobs.prepare.outputs.previous_tag }}'
				},
				release_commit: {
					description: 'Commit being released',
					value: '${{ jobs.prepare.outputs.release_commit }}'
				}
			}
		}
	},
	concurrency: {
		group: 'prepare-release-${{ github.run_id }}',
		'cancel-in-progress': false
	},
	permissions: {
		contents: 'write'
	},
	jobs: {
		prepare: {
			'runs-on': 'ubuntu-latest',
			outputs: {
				current_version: '${{ steps.version.outputs.current_version }}',
				release_version: '${{ steps.version.outputs.release_version }}',
				release_tag: '${{ steps.version.outputs.release_tag }}',
				previous_tag: '${{ steps.version.outputs.previous_tag }}',
				release_commit: '${{ steps.version.outputs.release_commit }}'
			},
			steps: [
				checkout({ 'fetch-depth': 0 }),
				setupNode(),
				{
					name: 'Fetch tags',
					run: 'git fetch --tags -f'
				},
				{
					name: 'Resolve release version',
					id: 'version',
					shell: 'bash',
					env: {
						INPUT_VERSION: '${{ inputs.version_number }}'
					},
					run: 'node ./scripts/resolve_release_version.mjs'
				},
				{
					name: 'Collect commits',
					id: 'commits',
					shell: 'bash',
					env: {
						PREVIOUS_TAG: '${{ steps.version.outputs.previous_tag }}',
						RELEASE_COMMIT: '${{ steps.version.outputs.release_commit }}'
					},
					run: 'node ./scripts/collect_release_commits.mjs'
				},
				{
					name: 'Generate release notes',
					shell: 'bash',
					env: {
						DEEPSEEK_API_KEY: '${{ secrets.DEEPSEEK_API_KEY }}',
						RELEASE_TAG: '${{ steps.version.outputs.release_tag }}',
						PREVIOUS_TAG: '${{ steps.version.outputs.previous_tag }}'
					},
					run: 'node ./scripts/generate_release_notes.mjs'
				},
				{
					name: 'Create draft release',
					uses: 'softprops/action-gh-release@v2',
					with: {
						draft: true,
						tag_name: '${{ steps.version.outputs.release_tag }}',
						name: '${{ steps.version.outputs.release_tag }}',
						target_commitish: '${{ steps.version.outputs.release_commit }}',
						body_path: 'release-notes.md'
					}
				}
			]
		}
	}
})

const current_dir = dirname(fileURLToPath(import.meta.url))
const output_path = resolve(current_dir, '../workflows/prepare.generated.yml')

createSerializer(workflow_definition, YAML.stringify).writeWorkflow(output_path)
