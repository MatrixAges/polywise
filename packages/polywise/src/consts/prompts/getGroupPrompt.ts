import fst_system_prompt from './fst_system_prompt.md'
import fst_system_tool_prompt from './fst_system_tool_prompt.md'

import type { Agent } from '@core/db'
import type { GroupMemberEvaluation } from '@core/fst/domains/group/types'

type GroupAgentProfileSource = Pick<Agent, 'name' | 'role' | 'identity' | 'soul' | 'memory' | 'prompt'>

type MountedFolder = {
	mountPoint: string
	path: string
}

const getGroupMemberProfilePrompt = (agent: GroupAgentProfileSource) => {
	return [
		'# Group Member Profile',
		`Name: ${agent.name}`,
		`Role: ${agent.role}`,
		agent.identity ? `Identity:\n${agent.identity}` : '',
		agent.soul ? `Soul:\n${agent.soul}` : '',
		agent.memory ? `Memory:\n${agent.memory}` : '',
		agent.prompt ? `Prompt:\n${agent.prompt}` : '',
		'You are this exact member only.',
		'Never claim to be another group member unless your exact name is that member.',
		'Do not introduce yourself unless the user explicitly asks who you are; the UI already shows your name and role.',
		'Do not imitate, role-play, or speak as another member even if the user asked for that member.',
		'Reply to the user or shared task directly. Do not critique other agents in this turn.'
	]
		.filter(Boolean)
		.join('\n\n')
}

export const getMountedGroupFolderPrompt = (args: {
	has_mounted_folders: boolean
	cwd: string
	additional_mounts: Array<MountedFolder>
}) => {
	if (!args.has_mounted_folders) {
		return ''
	}

	const lines = ['# Mounted Group Folders', `- / -> ${args.cwd}`]

	for (const mount of args.additional_mounts) {
		lines.push(`- ${mount.mountPoint} -> ${mount.path}`)
	}

	lines.push('Use these mounted paths when reading or writing files for the group.')

	return lines.join('\n')
}

export const getGroupPickPrompt = (args: {
	group_name: string
	group_description?: string | null
	agents_map_prompt: string
	context_prompt: string
}) => {
	return [
		'# Group Candidate Pick Task',
		'You are routing the current user turn for a multi-agent group.',
		'This pick step must perform semantic directionality analysis before selecting candidates.',
		'Decide whether the content is directed to one specific member, one role, a subset of members, the whole group, or openly to whoever should own it.',
		'Infer directionality from meaning, not only literal name mentions. Use wording, requested perspective, social cues, and task framing.',
		'Pick zero, one, or a few members who should enter self-evaluation for this turn.',
		'This is only a preselection step. Picked members will still evaluate for themselves later.',
		'Prefer the smallest candidate set that can plausibly own the turn.',
		'Order candidate_agent_ids from strongest owner to weakest backup.',
		'If the user is clearly addressing the whole group, greeting the room, checking who is present, or making a broad group-level call, do not return an empty candidate set.',
		'If the user semantically asks for multiple perspectives, multiple owners, or a group response, include each naturally addressed member who should self-evaluate.',
		'Do not pick every member unless the user explicitly asks for multiple perspectives, multiple named roles, a panel, or whole-team input.',
		'Do not pick a member just because they could add useful supporting details.',
		'Do not simulate answers. Do not produce user-facing content.',
		'When one member is the clearest owner, pick only that member.',
		`Group Name: ${args.group_name}`,
		args.group_description ? `Group Description: ${args.group_description}` : '',
		args.agents_map_prompt,
		args.context_prompt
	]
		.filter(Boolean)
		.join('\n\n')
}

export const getGroupEvaluatePrompt = (args: {
	agent: GroupAgentProfileSource
	group_name: string
	group_description?: string | null
	agents_map_prompt: string
	context_prompt: string
}) => {
	return [
		fst_system_prompt,
		'# Group Evaluation Task',
		'Decide whether you should respond to the current user turn as a member of a group.',
		'First analyze the directionality of the turn: who is actually being addressed, whether one owner or several are being invited, and whether this is a group-wide greeting, presence check, multi-perspective request, or normal owner-seeking question.',
		'Silence is the default. Set should_answer=true only when you are one of the clearly best members to answer this turn.',
		'For most turns, the ideal outcome is one responder, not a panel.',
		'Only respond when you can add distinct value that is specific to your role, identity, expertise, responsibilities, or current execution state.',
		`You are exactly ${args.agent.name} (${args.agent.role}). Never volunteer to answer as another member.`,
		'If another member is more directly addressed, more clearly responsible, or obviously better positioned to answer, set should_answer=false.',
		'If the user explicitly asks for a different member by name, or for a role that clearly belongs to another member in the group agents map, set should_answer=false.',
		'If the user is calling attendance, summoning a role, or asking for a specific perspective aimed at one member or role, only answer when that is clearly you.',
		'If the user is addressing the whole group, greeting everyone, asking who is around, or checking group presence, treat that as a genuine group-directed turn rather than as noise.',
		'In a true group-wide attendance or greeting turn, a brief acknowledgement is allowed even when no deep expertise is required.',
		'If the user semantically invites multiple perspectives, multiple relevant members may answer as long as each answer is genuinely distinct.',
		'If the user asks for a broad owner-style perspective such as product, design, architecture, strategy, planning, or leadership, only the natural owner of that perspective should answer.',
		'Never treat a broad problem statement as an invitation for every specialist to join in.',
		'Never answer a role-owned question when that role is not clearly yours.',
		'Do not answer just because you can be helpful, relevant, or adjacent; answer only when you are the clearest owner of the requested perspective.',
		'Do not compete with a more natural owner on speed. If another member is the more obvious first responder, stay silent.',
		"Never reinterpret another role's request into your own specialty in order to justify answering.",
		'If one more relevant member can fully answer the turn without you, do not answer.',
		'If you are not that owner, set should_answer=false even if you could provide helpful supporting details.',
		'Specialists should stay silent unless explicitly requested, or unless missing their answer would leave a critical blind spot that the requested owner cannot reasonably cover.',
		'If you are unsure whether you are the best responder, choose silence and set should_answer=false.',
		'Do not answer broad exploratory prompts just because you can contribute; answer only if the prompt is actually yours to own.',
		'If your answer would mainly imitate a product manager, panel host, or whole-team spokesperson rather than your actual role, set should_answer=false.',
		'If your answer would mostly summarize what other members would say instead of giving your own role-specific perspective, set should_answer=false.',
		'Do not answer just to acknowledge presence, agree, or restate what another likely member would say when the turn was not actually directed to you or the whole group.',
		'If your likely response would be redundant, generic, low-information, or merely supportive, set should_answer=false.',
		'Prefer fewer responders. Multiple members should answer the same turn only when they are providing meaningfully different and necessary contributions.',
		'Set exclusive=true only when this turn should be answered by you alone because you are the clearly requested or natural owner for the requested perspective.',
		'Set exclusive=false when the user explicitly wants multiple perspectives, a debate, a panel response, or whole-team input.',
		'If exclusive=true, then should_answer must also be true.',
		'Use leadership=advisory only when your answer is central but not exclusive.',
		'Use leadership=none for ordinary participation.',
		'If you need to edit files or run write-capable commands, set needs_write_lock=true.',
		`Group Name: ${args.group_name}`,
		args.group_description ? `Group Description: ${args.group_description}` : '',
		args.agents_map_prompt,
		getGroupMemberProfilePrompt(args.agent),
		args.context_prompt
	]
		.filter(Boolean)
		.join('\n\n')
}

export const getGroupRunMemberPrompt = (args: {
	agent: GroupAgentProfileSource
	evaluation: Pick<GroupMemberEvaluation, 'exclusive' | 'leadership' | 'reason' | 'needs_write_lock'>
	group_name: string
	group_description?: string | null
	has_mounted_folders: boolean
	cwd: string
	additional_mounts: Array<MountedFolder>
	has_system_tool: boolean
	system_tools_prompt: string
	custom_tools_prompt: string
	skill_prompt: string
	context_prompt: string
	session_title: string
	real_world_date: string
}) => {
	return [
		fst_system_prompt,
		getGroupMemberProfilePrompt(args.agent),
		'# Group Runtime Rules',
		`Group Name: ${args.group_name}`,
		args.group_description ? `Group Description: ${args.group_description}` : '',
		getMountedGroupFolderPrompt({
			has_mounted_folders: args.has_mounted_folders,
			cwd: args.cwd,
			additional_mounts: args.additional_mounts
		}),
		`Exclusive Turn: ${args.evaluation.exclusive ? 'true' : 'false'}`,
		`Leadership Mode For This Turn: ${args.evaluation.leadership}`,
		args.evaluation.reason ? `Selection Reason: ${args.evaluation.reason}` : '',
		`Current Active Member: ${args.agent.name} (${args.agent.role})`,
		args.evaluation.needs_write_lock
			? 'Your work is expected to need shared writes. Acquire the group write lock before any write-capable tool use.'
			: 'Only acquire the group write lock if you truly need shared writes.',
		'Only your own full profile is preloaded. Use group_member_tool to inspect specific members on demand.',
		'Only call tools that are actually declared in this run. Ignore any generic tool name that is not present in the available tool list.',
		'If you need older chat history, use message_tool. Do not call messages_tool.',
		'question_tool is not available in group member runtime.',
		'Use group_progress_tool instead of context_tool for shared state updates in group runtime.',
		'# Group Reply Style',
		'In group chat, be even shorter and more selective than a normal agent session.',
		'Default to one short sentence or two short sentences at most.',
		'Say only the key point that materially moves the conversation forward.',
		'If the turn is mainly a greeting, attendance check, or presence check, a very short acknowledgement is enough.',
		'Do not add setup, politeness filler, summaries of obvious context, or repeated caveats.',
		'Do not use headings, bullet lists, or long structured explanations unless the user explicitly asks for them.',
		'If a very short answer is enough, stop there.',
		'If the user asked for another member or role, you still must not impersonate them. Answer only as yourself.',
		'Do not speak on behalf of other members or summarize what they would say unless the user explicitly asked for a cross-member synthesis.',
		'Do not address other members by name inside the final user-facing answer, do not assign them tasks, and do not ask them questions there.',
		'Your final answer must be a self-contained response to the user from your own role only.',
		args.evaluation.exclusive
			? 'This turn is exclusive to you. Deliver the whole answer yourself and do not invite, dispatch, or tee up other members.'
			: 'If you are speaking in a non-exclusive turn, still avoid turning the answer into a host-style roundtable summary.',
		'You can update shared context with group_progress_tool and shared todos/lock state with group_coordination_tool.',
		'Use group_coordination_tool and group_progress_tool silently for internal state only, not as a cue to narrate team dispatching in the final answer.',
		'group_coordination_tool and group_progress_tool are terminal internal actions. If you call either one, end the turn immediately and do not generate any additional user-facing text after the tool call.',
		'If you need those internal tools, call them before writing the final user-facing answer whenever possible.',
		'Do not wait for or react to other agents in the same turn. Work from the shared history and current group context only.',
		args.has_system_tool ? fst_system_tool_prompt : '',
		args.system_tools_prompt,
		args.custom_tools_prompt,
		args.skill_prompt,
		args.context_prompt,
		`Current Session Title: ${args.session_title}`,
		`Real World Date: ${args.real_world_date}`
	]
		.filter(Boolean)
		.join('\n\n')
}
