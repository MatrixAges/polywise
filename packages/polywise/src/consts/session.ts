export const blocked_session_ids = ['global_panel_session', 'global_linkcase_session'] as const
export const blocked_session_id = blocked_session_ids[0]

const blocked_session_id_set = new Set<string>(blocked_session_ids)

export const isBlockedSessionId = (session_id: string) => blocked_session_id_set.has(session_id)
