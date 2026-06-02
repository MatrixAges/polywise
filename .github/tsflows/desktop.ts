#!/usr/bin/env bun
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createSerializer } from '@jlarky/gha-ts/render'
import { workflow } from '@jlarky/gha-ts/workflow-types'
import { YAML } from 'bun'

const release_branch_name = 'build'
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

const mac_asset_glob = [
	'packages/desktop/release/mac/x64/*.dmg',
	'packages/desktop/release/mac/x64/*.zip',
	'packages/desktop/release/mac/x64/*.blockmap',
	'packages/desktop/release/mac/x64/latest*.yml'
].join('\n')

const mac_arm_asset_glob = [
	'packages/desktop/release/mac/arm64/*.dmg',
	'packages/desktop/release/mac/arm64/*.zip',
	'packages/desktop/release/mac/arm64/*.blockmap',
	'packages/desktop/release/mac/arm64/latest*.yml'
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

const default_install_command = [
	"printf '\\ntrustLockfile: true\\n' >> pnpm-workspace.yaml",
	'pnpm install --frozen-lockfile --filter "./packages/desktop..." --filter "./packages/polywise..." --filter "./packages/app..." --filter "./packages/stk..." --filter "./packages/erpc..."'
].join('\n')

const windows_install_command = [
	"printf '\\ntrustLockfile: true\\n' >> pnpm-workspace.yaml",
	'pnpm install --frozen-lockfile --ignore-scripts --filter "./packages/desktop..." --filter "./packages/polywise..." --filter "./packages/app..." --filter "./packages/stk..." --filter "./packages/erpc..."'
].join('\n')

const windows_prepare_runtime_command = [
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
							source_dir: 'packages/desktop/release/mac/x64',
							destination_dir: 'release/darwin/x64',
							build_command: [
								desktop_shared_build_command,
								'pnpm --dir packages/desktop exec cross-env ZIP=0 BUILD_ARCH=x64 electron-builder -m --x64 --publish never',
								'pnpm --dir packages/desktop exec cross-env BUILD_ARCH=x64 electron-builder -m --x64 --publish never'
							].join('\n')
						},
						{
							runner: 'macos-latest',
							args: '--arm64',
							name: 'macOS (arm64)',
							artifact_name: 'polywise-macos-arm64',
							asset_glob: mac_arm_asset_glob,
							source_dir: 'packages/desktop/release/mac/arm64',
							destination_dir: 'release/darwin/arm64',
							build_command: [
								desktop_shared_build_command,
								'pnpm --dir packages/desktop exec cross-env ZIP=0 BUILD_ARCH=arm64 electron-builder -m --arm64 --publish never',
								'pnpm --dir packages/desktop exec cross-env BUILD_ARCH=arm64 electron-builder -m --arm64 --publish never'
							].join('\n')
						},
						{
							runner: 'windows-latest',
							name: 'Windows (x64)',
							artifact_name: 'polywise-windows-x64',
							asset_glob: win_asset_glob,
							source_dir: 'packages/desktop/release/win32/x64',
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
				{
					uses: 'actions/checkout@v6',
					with: {
						'fetch-depth': 0,
						ref: release_branch_name
					}
				},
				{
					name: 'Pin build branch to release commit',
					shell: 'bash',
					run: 'git checkout --detach "${{ inputs.release_commit }}"'
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
						cache: 'pnpm',
						'cache-dependency-path': 'pnpm-lock.yaml'
					}
				},
				{
					name: 'Setup Bun',
					uses: 'oven-sh/setup-bun@v2'
				},
				{
					name: 'Cache Electron binaries (Windows)',
					if: "matrix.runner == 'windows-latest'",
					uses: 'actions/cache@v4',
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
					if: "matrix.runner == 'windows-latest'",
					uses: 'actions/cache@v4',
					with: {
						path: '${{ env.LOCALAPPDATA }}\\node-gyp\\Cache',
						key: "${{ runner.os }}-node-gyp-${{ hashFiles('pnpm-lock.yaml', 'packages/polywise/package.json', 'packages/desktop/package.json') }}"
					}
				},
				{
					name: 'Install dependencies',
					if: "matrix.runner != 'windows-latest'",
					shell: 'bash',
					run: default_install_command
				},
				{
					name: 'Install dependencies (Windows)',
					if: "matrix.runner == 'windows-latest'",
					shell: 'bash',
					run: windows_install_command
				},
				{
					name: 'Prepare native runtime dependencies (Windows)',
					if: "matrix.runner == 'windows-latest'",
					shell: 'bash',
					run: windows_prepare_runtime_command
				},
				{
					name: 'Validate mac signing secrets',
					if: "matrix.runner == 'macos-latest'",
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
					uses: 'ryand56/r2-upload-action@v1.4',
					with: {
						'r2-account-id': '${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
						'r2-access-key-id': '${{ secrets.R2_ACCESS_KEY_ID }}',
						'r2-secret-access-key': '${{ secrets.R2_SECRET_ACCESS_KEY }}',
						'r2-bucket': '${{ secrets.R2_BUCKET }}',
						'source-dir': '${{ matrix.source_dir }}',
						'destination-dir': '${{ matrix.destination_dir }}'
					}
				},
				{
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
					name: 'Download release assets',
					uses: 'actions/download-artifact@v5',
					with: {
						path: 'release-assets',
						'merge-multiple': true
					}
				},
				{
					name: 'Attach assets to draft release',
					uses: 'softprops/action-gh-release@v3',
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

const output_path = resolve(current_dir, '../workflows/desktop.generated.yml')

createSerializer(workflow_definition, YAML.stringify).writeWorkflow(output_path)
