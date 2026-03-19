import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'task',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// 任务分类（消费任务时，每个分类是独立执行的）：triple（article三元组生成）、link（根据链接生成 article）
		type: text('type').notNull(),
		// 传递给执行函数的参数
		args: text('args', { mode: 'json' }).$type<Record<string, any>>().notNull(),
		// 任务状态：pending（排队中）、runing（执行中）、success（执行成功）、fail（执行失败）、awaiting（需要确认）、skipped（已忽略）、timeout（已超时）
		status: text('status').default('pending'),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [index('task_type_idx').on(t.type), index('task_status_idx').on(t.status)]
)
