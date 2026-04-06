const DANGEROUS_COMMANDS = [
	'rm',
	'sudo',
	'chmod',
	'chown',
	'dd',
	'mkfs',
	'fdisk',
	'kill',
	'pkill',
	'killall',
	'mv',
	'cp'
]

const DANGEROUS_COMMANDS_PATTERN = DANGEROUS_COMMANDS.map(cmd => `\\b${cmd}\\b`).join('|')

const SHELL_INJECTION_RISK_PATTERN = new RegExp(
	[
		DANGEROUS_COMMANDS_PATTERN,
		'[>]{1,2}',
		'[<]{1,2}',
		';',
		'&{1,2}',
		'\\|{1,2}',
		'`',
		'\\$\\(',
		'\\$',
		'\\\\'
	].join('|'),
	'i'
)

export const detectShellInjectionRisk = (input: string): boolean => {
	return SHELL_INJECTION_RISK_PATTERN.test(input)
}

export const escapeShellArg = (input: string): string => {
	return `'${input.replace(/'/g, "'\\''")}'`
}
