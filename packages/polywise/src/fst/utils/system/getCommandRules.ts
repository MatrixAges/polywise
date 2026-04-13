const command_rules: Record<string, Array<string>> = {
	rm: ['(^|\\s)rm\\s+(-[A-Za-z]*[rf][A-Za-z]*\\s+)?(/|~|\\.\\./|\\./)', '(^|\\s)rm\\s+-rf\\s+'],
	mv: ['(^|\\s)mv\\s+.+\\s+(/|~|\\.\\./)'],
	cp: ['(^|\\s)cp\\s+(-[A-Za-z]*[rR][A-Za-z]*\\s+)?.+\\s+(/|~|\\.\\./)'],
	chmod: ['(^|\\s)chmod\\s+[0-7]{3,4}\\s+', '(^|\\s)chmod\\s+-R\\s+'],
	chown: ['(^|\\s)chown\\s+', '(^|\\s)chown\\s+-R\\s+'],
	dd: ['(^|\\s)dd\\s+'],
	mkfs: ['(^|\\s)mkfs(\\.[A-Za-z0-9_+-]+)?\\s+'],
	fdisk: ['(^|\\s)fdisk\\s+'],
	kill: ['(^|\\s)kill\\s+(-?[0-9A-Z]+\\s+)?[0-9]+'],
	pkill: ['(^|\\s)pkill\\s+'],
	killall: ['(^|\\s)killall\\s+'],
	git: [
		'(^|\\s)git\\s+push\\b',
		'(^|\\s)git\\s+reset\\s+--hard\\b',
		'(^|\\s)git\\s+clean\\s+-[A-Za-z]*f',
		'(^|\\s)git\\s+checkout\\s+--\\s+',
		'(^|\\s)git\\s+rebase\\b',
		'(^|\\s)git\\s+commit\\b'
	],
	curl: ['(^|\\s)curl\\s+.+\\|', '(^|\\s)curl\\s+.+-o\\s+', '(^|\\s)curl\\s+.+--output\\s+'],
	wget: ['(^|\\s)wget\\s+.+-O\\s+', '(^|\\s)wget\\s+.+\\|'],
	ssh: ['(^|\\s)ssh\\s+'],
	sudo: ['(^|\\s)sudo\\s+']
}

export default (command_name: string) => {
	return command_rules[command_name] ?? []
}
