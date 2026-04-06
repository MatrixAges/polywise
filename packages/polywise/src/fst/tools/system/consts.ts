export const SYSTEM_MOUNT_PATHS: Record<string, string[]> = {
	darwin: ['/Users', '/Applications', '/Volumes', '/usr/local', '/opt', '/tmp'],
	linux: ['/home', '/var', '/opt', '/mnt', '/media', '/tmp'],
	win32: ['C:\\Users', 'C:\\ProgramData']
}
