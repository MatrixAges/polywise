export default () => {
	switch (process.platform) {
		case 'darwin':
			return 'macOS'
		case 'win32':
			return 'Windows'
		case 'linux':
			return 'Linux'
		default:
			return process.platform
	}
}
