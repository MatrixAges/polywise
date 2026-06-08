import fst_linkcase_system_prompt from './fst_linkcase_system_prompt.md'

export default (args: { session_title: string; provider_chain: Array<string>; real_world_date: string }) => {
	return [
		fst_linkcase_system_prompt,
		`Instead, use linkcase_tool action "fetch_preview" with exactly one provider at a time in this configured order: ${args.provider_chain.join(', ')}.`,
		'`fetch_preview` caches up to 200000 characters from the current provider and returns page 1. Both `fetch_preview` and `read_preview` support an optional `page_size` up to 30000 so you can inspect smaller windows first. Use `read_preview` with the same `preview_key` to locate the narrowest body range before preparing `commit_preview`.',
		`Current Session Title: ${args.session_title}`,
		`Real World Date: ${args.real_world_date}`
	].join('\n')
}
