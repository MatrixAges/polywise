import Sessions from '../Session'

export interface ToolArgs {
	cwd: string
	sessions: Sessions
	summarize: (content: string) => Promise<string>
}
