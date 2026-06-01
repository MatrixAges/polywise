#!/usr/bin/env bun
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createSerializer } from '@jlarky/gha-ts/render'
import { workflow } from '@jlarky/gha-ts/workflow-types'
import { YAML } from 'bun'

const release_branch_name = 'build'
const source_branch_name = 'master'

const workflow_definition = workflow({
	name: 'Release: Step 1 - Prepare',
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
					description: 'Release commit persisted to the repository',
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
				release_commit: '${{ steps.persist.outputs.release_commit }}'
			},
			steps: [
				{
					uses: 'actions/checkout@v6',
					with: {
						'fetch-depth': 0,
						ref: release_branch_name
					}
				},
				{
					uses: 'actions/setup-node@v6'
				},
				{
					name: 'Fetch tags',
					run: 'git fetch --tags -f'
				},
				{
					name: 'Sync build branch with latest master',
					shell: 'bash',
					run: [
						`git fetch origin ${source_branch_name} ${release_branch_name} --tags -f`,
						`git checkout ${release_branch_name}`,
						`git reset --hard origin/${release_branch_name}`,
						`git pull --no-rebase origin ${source_branch_name}`
					].join('\n')
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
					name: 'Apply release version to repository files',
					shell: 'bash',
					env: {
						RELEASE_VERSION: '${{ steps.version.outputs.release_version }}'
					},
					run: 'node ./scripts/apply_release_version.mjs'
				},
				{
					name: 'Collect commits',
					id: 'commits',
					shell: 'bash',
					env: {
						PREVIOUS_TAG: '${{ steps.version.outputs.previous_tag }}',
						RELEASE_COMMIT: 'HEAD'
					},
					run: 'node ./scripts/collect_release_commits.mjs'
				},
				{
					name: 'Commit and push release version',
					id: 'persist',
					shell: 'bash',
					env: {
						RELEASE_VERSION: '${{ steps.version.outputs.release_version }}'
					},
					run: [
						'git config user.name "github-actions[bot]"',
						'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
						'git add packages/polywise/package.json packages/app/package.json packages/desktop/package.json',
						'git commit -m "chore(release): v${RELEASE_VERSION}"',
						`git push origin HEAD:${release_branch_name}`,
						`git push origin HEAD:${source_branch_name}`,
						'echo "release_commit=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"'
					].join('\n')
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
					uses: 'softprops/action-gh-release@v3',
					with: {
						draft: true,
						tag_name: '${{ steps.version.outputs.release_tag }}',
						name: '${{ steps.version.outputs.release_tag }}',
						target_commitish: '${{ steps.persist.outputs.release_commit }}',
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
