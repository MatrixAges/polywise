#!/usr/bin/env bun
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { checkout, setupNode } from '@jlarky/gha-ts/actions'
import { createSerializer } from '@jlarky/gha-ts/render'
import { workflow } from '@jlarky/gha-ts/workflow-types'
import { YAML } from 'bun'

const mac_asset_glob = [
	'packages/desktop/release/mac/x64/*.dmg',
	'packages/desktop/release/mac/x64/*.zip',
	'packages/desktop/release/mac/x64/*.blockmap',
	'packages/desktop/release/mac/x64/latest*.yml'
].join('\n')

const win_asset_glob = [
	'packages/desktop/release/win/x64/*.exe',
	'packages/desktop/release/win/x64/*.blockmap',
	'packages/desktop/release/win/x64/latest*.yml'
].join('\n')

const desktop_shared_build_command = [
	'pnpm --filter "./packages/stk" run build',
	'pnpm --filter "./packages/erpc" run build',
	'pnpm --filter "./packages/app" run build:electron',
	'pnpm --filter "./packages/polywise" run build:electron',
	'pnpm --dir packages/desktop run clean',
	'pnpm --dir packages/desktop run main:prod',
	'pnpm --dir packages/desktop run transform'
].join('\n')

const workflow_definition = workflow({
	name: 'Build Desktop Release',
	on: {
		workflow_call: {
			inputs: {
				release_version: {
					required: true,
					type: 'string',
					description: 'Resolved release version'
				},
				release_tag: {
					required: true,
					type: 'string',
					description: 'Resolved release tag'
				},
				release_commit: {
					required: true,
					type: 'string',
					description: 'Commit being released'
				}
			},
			secrets: {
				APPLE_ID: {
					required: true,
					description: 'Apple developer account email used for notarization'
				},
				APPLE_TEAM_ID: {
					required: true,
					description: 'Apple Team ID used for signing and notarization'
				},
				APPLE_APP_SECRET: {
					required: true,
					description: 'Apple app-specific password used for notarization'
				},
				CSC_LINK: {
					required: true,
					description: 'Developer ID Application certificate payload or link for electron-builder'
				},
				CSC_KEY_PASSWORD: {
					required: true,
					description: 'Password for the certificate provided via CSC_LINK'
				},
				R2_ACCOUNT_ID: {
					required: true,
					description: 'Cloudflare R2 account id'
				},
				R2_ACCESS_KEY_ID: {
					required: true,
					description: 'Cloudflare R2 access key id'
				},
				R2_SECRET_ACCESS_KEY: {
					required: true,
					description: 'Cloudflare R2 secret access key'
				},
				R2_BUCKET: {
					required: true,
					description: 'Cloudflare R2 bucket name'
				}
			}
		}
	},
	concurrency: {
		group: 'desktop-release-${{ github.run_id }}',
		'cancel-in-progress': false
	},
	permissions: {
		contents: 'write'
	},
	jobs: {
		build: {
			strategy: {
				'fail-fast': false,
				matrix: {
					include: [
						{
							runner: 'macos-13',
							name: 'macOS (x64)',
							artifact_name: 'polywise-macos-x64',
							asset_glob: mac_asset_glob,
							source_dir: 'packages/desktop/release/mac/x64',
							destination_dir: 'release/darwin/x64',
							build_command: [
								desktop_shared_build_command,
								'pnpm --dir packages/desktop exec cross-env ZIP=0 electron-builder -m --publish never',
								'pnpm --dir packages/desktop exec electron-builder -m --publish never'
							].join('\n')
						},
						{
							runner: 'windows-latest',
							name: 'Windows (x64)',
							artifact_name: 'polywise-windows-x64',
							asset_glob: win_asset_glob,
							source_dir: 'packages/desktop/release/win/x64',
							destination_dir: 'release/win32/x64',
							build_command: [
								desktop_shared_build_command,
								'pnpm --dir packages/desktop exec electron-builder -w --publish never'
							].join('\n')
						}
					]
				}
			},
			name: '${{ matrix.name }}',
			'runs-on': '${{ matrix.runner }}',
			steps: [
				checkout({
					'fetch-depth': 0,
					ref: '${{ inputs.release_commit }}'
				}),
				setupNode({
					cache: 'pnpm',
					'cache-dependency-path': 'pnpm-lock.yaml'
				}),
				{
					name: 'Setup pnpm',
					uses: 'pnpm/action-setup@v4',
					with: {
						run_install: false
					}
				},
				{
					name: 'Setup Bun',
					uses: 'oven-sh/setup-bun@v2'
				},
				{
					name: 'Install dependencies',
					run: 'pnpm install --frozen-lockfile'
				},
				{
					name: 'Validate mac signing secrets',
					if: "matrix.runner == 'macos-13'",
					shell: 'bash',
					env: {
						APPLE_ID: '${{ secrets.APPLE_ID }}',
						APPLE_TEAM_ID: '${{ secrets.APPLE_TEAM_ID }}',
						APPLE_APP_SECRET: '${{ secrets.APPLE_APP_SECRET }}',
						CSC_LINK: '${{ secrets.CSC_LINK }}',
						CSC_KEY_PASSWORD: '${{ secrets.CSC_KEY_PASSWORD }}'
					},
					run: [
						'[ -n "$APPLE_ID" ]',
						'[ -n "$APPLE_TEAM_ID" ]',
						'[ -n "$APPLE_APP_SECRET" ]',
						'[ -n "$CSC_LINK" ]',
						'[ -n "$CSC_KEY_PASSWORD" ]'
					].join('\n')
				},
				{
					name: 'Build desktop assets',
					shell: 'bash',
					env: {
						CI: 'true',
						GH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
						APP_VERSION: '${{ inputs.release_version }}',
						APPLE_ID: '${{ secrets.APPLE_ID }}',
						APPLE_TEAM_ID: '${{ secrets.APPLE_TEAM_ID }}',
						APPLE_APP_SPECIFIC_PASSWORD: '${{ secrets.APPLE_APP_SECRET }}',
						CSC_LINK: '${{ secrets.CSC_LINK }}',
						CSC_KEY_PASSWORD: '${{ secrets.CSC_KEY_PASSWORD }}'
					},
					run: '${{ matrix.build_command }}'
				},
				{
					name: 'Upload assets to Cloudflare R2',
					uses: 'ryand56/r2-upload-action@latest',
					with: {
						'r2-account-id': '${{ secrets.R2_ACCOUNT_ID }}',
						'r2-access-key-id': '${{ secrets.R2_ACCESS_KEY_ID }}',
						'r2-secret-access-key': '${{ secrets.R2_SECRET_ACCESS_KEY }}',
						'r2-bucket': '${{ secrets.R2_BUCKET }}',
						'source-dir': '${{ matrix.source_dir }}',
						'destination-dir': '${{ matrix.destination_dir }}'
					}
				},
				{
					name: 'Upload release assets',
					uses: 'actions/upload-artifact@v4',
					with: {
						name: '${{ matrix.artifact_name }}',
						'if-no-files-found': 'error',
						path: '${{ matrix.asset_glob }}'
					}
				}
			]
		},
		release: {
			needs: ['build'],
			'runs-on': 'ubuntu-latest',
			steps: [
				{
					name: 'Download release assets',
					uses: 'actions/download-artifact@v4',
					with: {
						path: 'release-assets',
						'merge-multiple': true
					}
				},
				{
					name: 'Attach assets to draft release',
					uses: 'softprops/action-gh-release@v2',
					with: {
						draft: true,
						tag_name: '${{ inputs.release_tag }}',
						name: '${{ inputs.release_tag }}',
						target_commitish: '${{ inputs.release_commit }}',
						fail_on_unmatched_files: true,
						files: 'release-assets/**/*'
					}
				}
			]
		}
	}
})

const current_dir = dirname(fileURLToPath(import.meta.url))
const output_path = resolve(current_dir, '../workflows/desktop.generated.yml')

createSerializer(workflow_definition, YAML.stringify).writeWorkflow(output_path)
