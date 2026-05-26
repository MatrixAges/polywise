export default (args: { job_name: string; cron: string; content: string }) => {
	return [
		'[CRON EXECUTION CONTEXT]',
		`Job Name: ${args.job_name}`,
		`Cron: ${args.cron}`,
		'This is an automatically triggered cron execution. Execute the task described below and use available tools as needed.',
		'',
		'[JOB SPEC]',
		args.content
	].join('\n')
}
