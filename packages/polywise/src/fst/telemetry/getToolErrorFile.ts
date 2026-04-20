import path from 'path'

export default (args: { app_path: string; tool_name: string }) => {
	const safe_name = args.tool_name.replace(/[^a-zA-Z0-9_-]/g, '_')

	return path.resolve(args.app_path, 'tool_call_errors', `${safe_name}.jsonl`)
}
