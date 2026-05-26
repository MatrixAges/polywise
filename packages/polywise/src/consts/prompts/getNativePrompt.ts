type NativeMount = {
	mountPoint: string
	path: string
}

export const getPathAnchorPrompt = (args: {
	user_home_dir: string
	host_cwd: string
	files_dir: string
	virtual_root: string
	project_dir?: string
	skills_dir?: string
	additional_mounts: Array<NativeMount>
}) => {
	const lines = [
		'Path anchors:',
		`- user home directory -> ${args.user_home_dir}`,
		`- default working directory -> ${args.host_cwd}`,
		`- session scratch directory -> ${args.files_dir}`,
		`- legacy virtual root / -> ${args.virtual_root}`
	] as Array<string>

	if (args.project_dir) {
		lines.push(`- project root -> ${args.project_dir}`)
	}

	if (args.skills_dir) {
		lines.push(`- /skills -> ${args.skills_dir}`)
	}

	for (const mount of args.additional_mounts) {
		lines.push(`- ${mount.mountPoint} -> ${mount.path}`)
	}

	return lines.join('\n')
}

export const getNativeAccessPrompt = (args: {
	user_home_dir: string
	host_cwd: string
	files_dir: string
	virtual_root: string
	project_dir?: string
	skills_dir?: string
	additional_mounts: Array<NativeMount>
}) => {
	return [
		'Full host access is enabled.',
		'You are not restricted to the default working directory. It only controls how relative paths are resolved.',
		'If the default working directory looks like a session scratch area, do not treat it as the main target automatically.',
		'You may read, write, and execute against any absolute host path on disk.',
		'When you need a broad filesystem starting point, begin from the user home directory or another explicit absolute path.',
		'When the target is outside the default working directory, use an absolute host path directly.',
		'For bash_tool, prefer the real host paths below instead of assuming virtual mounted paths exist in the shell.',
		getPathAnchorPrompt(args),
		'Environment variables exposed to shell commands:',
		'- POLYWISE_USER_HOME',
		'- POLYWISE_DEFAULT_CWD',
		'- POLYWISE_SESSION_FILES_DIR',
		'- POLYWISE_VIRTUAL_ROOT',
		'- POLYWISE_PATH_MAPPINGS_JSON'
	].join('\n')
}
