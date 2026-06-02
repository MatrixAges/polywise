#!/usr/bin/env bun
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createSerializer } from '@jlarky/gha-ts/render'
import { workflow } from '@jlarky/gha-ts/workflow-types'
import { YAML } from 'bun'

const release_branch_name = 'build'
const current_dir = dirname(fileURLToPath(import.meta.url))
const release_base_url = 'https://files.polywise.io/release'

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

const mac_asset_glob = [
	'packages/desktop/release/darwin/x64/*.dmg',
	'packages/desktop/zip/darwin/x64/*.zip',
	'packages/desktop/release/darwin/x64/*.blockmap',
	'packages/desktop/release/darwin/x64/latest*.yml'
].join('\n')

const mac_arm_asset_glob = [
	'packages/desktop/release/darwin/arm64/*.dmg',
	'packages/desktop/zip/darwin/arm64/*.zip',
	'packages/desktop/release/darwin/arm64/*.blockmap',
	'packages/desktop/release/darwin/arm64/latest*.yml'
].join('\n')

const win_asset_glob = [
	'packages/desktop/release/win32/x64/*.exe',
	'packages/desktop/release/win32/x64/*.blockmap',
	'packages/desktop/release/win32/x64/latest*.yml'
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

const retry_command = [
	'retryCommand() {',
	'\tmax_attempts="$1"',
	'\tsleep_seconds="$2"',
	'\tshift 2',
	'\tattempt=1',
	'\twhile true; do',
	'\t\t"$@" && return 0',
	'\t\tif [ "$attempt" -ge "$max_attempts" ]; then',
	'\t\t\treturn 1',
	'\t\tfi',
	'\t\tattempt=$((attempt + 1))',
	'\t\tsleep "$sleep_seconds"',
	'\tdone',
	'}'
].join('\n')

const default_install_command = [
	"printf '\\ntrustLockfile: true\\n' >> pnpm-workspace.yaml",
	'pnpm install --frozen-lockfile --filter "./packages/desktop..." --filter "./packages/polywise..." --filter "./packages/app..." --filter "./packages/stk..." --filter "./packages/erpc..."'
].join('\n')

const windows_install_command = [
	"printf '\\ntrustLockfile: true\\n' >> pnpm-workspace.yaml",
	'pnpm install --frozen-lockfile --ignore-scripts --filter "./packages/desktop..." --filter "./packages/polywise..." --filter "./packages/app..." --filter "./packages/stk..." --filter "./packages/erpc..."'
].join('\n')

const windows_prepare_runtime_command = [
	'pnpm rebuild bun',
	'pnpm rebuild lmdb',
	'pnpm rebuild electron node-llama-cpp sqlite-vec @node-rs/jieba @node-rs/xxhash',
	'pnpm --dir packages/desktop run rebuild'
].join('\n')

const workflow_definition = workflow({
	name: 'Release: Step 3 - Desktop',
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
				CLOUDFLARE_ACCOUNT_ID: {
					required: true,
					description: 'Cloudflare account id'
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
							runner: 'macos-latest',
							args: '--x64',
							name: 'macOS (x64)',
							artifact_name: 'polywise-macos-x64',
							asset_glob: mac_asset_glob,
							upload_dir: 'packages/desktop/.release-upload/darwin/x64',
							destination_dir: 'release/darwin/x64',
							build_command: [
								desktop_shared_build_command,
								'cross-env BUILD_ARCH=x64 pnpm --dir packages/desktop run rebuild',
								retry_command,
								'retryCommand 3 12 pnpm --dir packages/desktop exec cross-env ZIP=0 BUILD_ARCH=x64 electron-builder -m --x64 --publish never',
								'retryCommand 3 12 pnpm --dir packages/desktop exec cross-env BUILD_ARCH=x64 electron-builder -m --x64 --publish never'
							].join('\n')
						},
						{
							runner: 'macos-latest',
							args: '--arm64',
							name: 'macOS (arm64)',
							artifact_name: 'polywise-macos-arm64',
							asset_glob: mac_arm_asset_glob,
							upload_dir: 'packages/desktop/.release-upload/darwin/arm64',
							destination_dir: 'release/darwin/arm64',
							build_command: [
								desktop_shared_build_command,
								'cross-env BUILD_ARCH=arm64 pnpm --dir packages/desktop run rebuild',
								retry_command,
								'retryCommand 3 12 pnpm --dir packages/desktop exec cross-env ZIP=0 BUILD_ARCH=arm64 electron-builder -m --arm64 --publish never',
								'retryCommand 3 12 pnpm --dir packages/desktop exec cross-env BUILD_ARCH=arm64 electron-builder -m --arm64 --publish never'
							].join('\n')
						},
						{
							runner: 'windows-latest',
							name: 'Windows (x64)',
							artifact_name: 'polywise-windows-x64',
							asset_glob: win_asset_glob,
							upload_dir: 'packages/desktop/.release-upload/win32/x64',
							destination_dir: 'release/win32/x64',
							build_command: [
								desktop_shared_build_command,
								'cross-env BUILD_ARCH=x64 pnpm --dir packages/desktop run rebuild',
								'pnpm --dir packages/desktop exec electron-builder -w --publish never'
							].join('\n')
						}
					]
				}
			},
			name: '${{ matrix.name }}',
			'runs-on': '${{ matrix.runner }}',
			steps: [
				{
					uses: 'actions/checkout@v6',
					with: {
						'fetch-depth': 0,
						ref: release_branch_name
					}
				},
				{
					uses: 'actions/setup-node@v6',
					with: {
						'node-version': 'lts/*'
					}
				},
				{
					name: 'Pin build branch to release commit',
					shell: 'bash',
					run: 'git checkout --detach "${{ inputs.release_commit }}"'
				},
				{
					name: 'Check platform asset on Cloudflare R2',
					id: 'asset_status',
					env: {
						RELEASE_BASE_URL: release_base_url,
						ASSET_GLOB: '${{ matrix.asset_glob }}'
					},
					run: 'node ./scripts/check_platform_asset_on_r2.mjs'
				},
				{
					if: "steps.asset_status.outputs.already_published != 'true'",
					name: 'Setup pnpm',
					uses: 'pnpm/action-setup@v6',
					with: {
						version: pnpm_version,
						run_install: false
					}
				},
				{
					if: "steps.asset_status.outputs.already_published != 'true'",
					uses: 'actions/setup-node@v6',
					with: {
						'node-version': 'lts/*',
						cache: 'pnpm',
						'cache-dependency-path': 'pnpm-lock.yaml'
					}
				},
				{
					if: "steps.asset_status.outputs.already_published != 'true'",
					name: 'Setup Bun',
					uses: 'oven-sh/setup-bun@v2'
				},
				{
					name: 'Cache Electron binaries (Windows)',
					if: "matrix.runner == 'windows-latest' && steps.asset_status.outputs.already_published != 'true'",
					uses: 'actions/cache@v5',
					with: {
						path: [
							'${{ env.LOCALAPPDATA }}\\electron\\Cache',
							'${{ env.LOCALAPPDATA }}\\electron-builder\\Cache'
						].join('\n'),
						key: "${{ runner.os }}-electron-cache-${{ hashFiles('pnpm-lock.yaml', 'packages/desktop/package.json') }}"
					}
				},
				{
					name: 'Cache node-gyp (Windows)',
					if: "matrix.runner == 'windows-latest' && steps.asset_status.outputs.already_published != 'true'",
					uses: 'actions/cache@v5',
					with: {
						path: '${{ env.LOCALAPPDATA }}\\node-gyp\\Cache',
						key: "${{ runner.os }}-node-gyp-${{ hashFiles('pnpm-lock.yaml', 'packages/polywise/package.json', 'packages/desktop/package.json') }}"
					}
				},
				{
					name: 'Install dependencies',
					if: "matrix.runner != 'windows-latest' && steps.asset_status.outputs.already_published != 'true'",
					shell: 'bash',
					run: default_install_command
				},
				{
					name: 'Install dependencies (Windows)',
					if: "matrix.runner == 'windows-latest' && steps.asset_status.outputs.already_published != 'true'",
					shell: 'bash',
					run: windows_install_command
				},
				{
					name: 'Prepare native runtime dependencies (Windows)',
					if: "matrix.runner == 'windows-latest' && steps.asset_status.outputs.already_published != 'true'",
					shell: 'bash',
					run: windows_prepare_runtime_command
				},
				{
					name: 'Validate mac signing secrets',
					if: "matrix.runner == 'macos-latest' && steps.asset_status.outputs.already_published != 'true'",
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
					if: "steps.asset_status.outputs.already_published != 'true'",
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
					if: "steps.asset_status.outputs.already_published != 'true'",
					name: 'Collect release assets for Cloudflare R2',
					env: {
						ASSET_GLOB: '${{ matrix.asset_glob }}',
						UPLOAD_DIR: '${{ matrix.upload_dir }}'
					},
					run: 'node ./scripts/collect_release_assets.mjs'
				},
				{
					if: "steps.asset_status.outputs.already_published != 'true'",
					name: 'Upload assets to Cloudflare R2',
					uses: 'ryand56/r2-upload-action@v1.4',
					with: {
						'r2-account-id': '${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
						'r2-access-key-id': '${{ secrets.R2_ACCESS_KEY_ID }}',
						'r2-secret-access-key': '${{ secrets.R2_SECRET_ACCESS_KEY }}',
						'r2-bucket': '${{ secrets.R2_BUCKET }}',
						'source-dir': '${{ matrix.upload_dir }}',
						'destination-dir': '${{ matrix.destination_dir }}'
					}
				},
				{
					if: "steps.asset_status.outputs.already_published != 'true'",
					name: 'Upload release assets',
					uses: 'actions/upload-artifact@v7',
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
					name: 'Check release artifacts',
					id: 'artifact_status',
					shell: 'bash',
					run: [
						'if [ "${{ needs.build.result }}" = "skipped" ]; then',
						'\techo "has_new_artifacts=false" >> "$GITHUB_OUTPUT"',
						'\texit 0',
						'fi',
						'echo "has_new_artifacts=true" >> "$GITHUB_OUTPUT"'
					].join('\n')
				},
				{
					if: "steps.artifact_status.outputs.has_new_artifacts == 'true'",
					name: 'Download release assets',
					uses: 'actions/download-artifact@v5',
					with: {
						path: 'release-assets',
						'merge-multiple': true
					}
				},
				{
					if: "steps.artifact_status.outputs.has_new_artifacts == 'true'",
					name: 'Upload release assets and publish release',
					uses: 'softprops/action-gh-release@v3',
					with: {
						draft: false,
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

const output_path = resolve(current_dir, '../workflows/desktop.generated.yml')

createSerializer(workflow_definition, YAML.stringify).writeWorkflow(output_path)
