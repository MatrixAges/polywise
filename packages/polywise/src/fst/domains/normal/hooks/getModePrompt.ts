import plan_mode_prompt from '@core/consts/prompts/plan_mode_prompt.md'
import planexec_exec_prompt from '@core/consts/prompts/planexec_exec_prompt.md'
import planexec_plan_prompt from '@core/consts/prompts/planexec_plan_prompt.md'
import { match } from 'ts-pattern'

import type Session from '../../../session'

export default (s: Session) =>
	match({ mode: s.mode, plan_stage: s.plan_stage })
		.with({ mode: 'plan' }, () => plan_mode_prompt)
		.with({ mode: 'plan-exec', plan_stage: 'plan' }, () => planexec_plan_prompt)
		.with({ mode: 'plan-exec', plan_stage: 'exec' }, () => planexec_exec_prompt)
		.otherwise(() => '')
