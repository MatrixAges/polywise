#!/usr/bin/env bun
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createSerializer } from '@jlarky/gha-ts/render'
import { workflow } from '@jlarky/gha-ts/workflow-types'
import { YAML } from 'bun'

const workflow_definition = workflow({
	name: 'Release',
	on: {
		workflow_dispatch: {
			inputs: {
				version_number: {
					description:
						'Optional release version in *.*.* format. Leave empty to auto-increment from packages/polywise/package.json.',
					required: false,
					type: 'string'
				}
			}
		}
	},
	concurrency: {
		group: 'release-${{ github.workflow }}-${{ github.run_id }}',
		'cancel-in-progress': false
	},
	permissions: {
		contents: 'write',
		'id-token': 'write'
	},
	jobs: {
		prepare: {
			uses: './.github/workflows/prepare.generated.yml',
			permissions: {
				contents: 'write'
			},
			with: {
				version_number: '${{ github.event.inputs.version_number }}'
			},
			secrets: 'inherit'
		},
		standalone: {
			needs: ['prepare'],
			uses: './.github/workflows/standalone.generated.yml',
			permissions: {
				contents: 'read',
				'id-token': 'write'
			},
			with: {
				release_version: '${{ needs.prepare.outputs.release_version }}',
				release_commit: '${{ needs.prepare.outputs.release_commit }}',
				release_tag: '${{ needs.prepare.outputs.release_tag }}'
			},
			secrets: 'inherit'
		},
		desktop: {
			needs: ['prepare', 'standalone'],
			uses: './.github/workflows/desktop.generated.yml',
			permissions: {
				contents: 'write'
			},
			with: {
				release_version: '${{ needs.prepare.outputs.release_version }}',
				release_tag: '${{ needs.prepare.outputs.release_tag }}',
				release_commit: '${{ needs.prepare.outputs.release_commit }}'
			},
			secrets: 'inherit'
		}
	}
})

const current_dir = dirname(fileURLToPath(import.meta.url))
const output_path = resolve(current_dir, '../workflows/release.generated.yml')

createSerializer(workflow_definition, YAML.stringify).writeWorkflow(output_path)
