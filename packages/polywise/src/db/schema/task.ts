import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'task',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// 任务类型
		type: text('type').notNull(),
		// 传递给执行函数的参数
		args: text('args', { mode: 'json' }).$type<Record<string, any>>().notNull(),
		// 任务进度（可选）：用于任务断点恢复
		progress: text('progress'),
		// 任务状态：pending（排队中）、runing（执行中）、success（执行成功）、fail（执行失败）
		status: text('status').default('pending'),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [index('task_type_idx').on(t.type)]
)
