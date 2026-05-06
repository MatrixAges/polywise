import { skill } from '@core/db/schema'
import { env } from '@core/env'
import { asc, max, SQL } from 'drizzle-orm'

import type { SkillInsert } from '@core/db'

interface ArgsGetSkills {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
}

export const addSkill = async (values: SkillInsert) => {
	return env.db
		.insert(skill)
		.values(values)
		.returning()
		.then(res => res[0])
}

export const getSkill = async (where: SQL) => {
	return env.db
		.select()
		.from(skill)
		.where(where)
		.limit(1)
		.then(res => res[0])
}

export const getSkills = async (args: ArgsGetSkills = {}) => {
	const { where, orderBy = [asc(skill.order), asc(skill.created_at)], limit } = args

	let query = env.db.select().from(skill).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)

	return query
}

export const getSkillOrderMax = async () => {
	return env.db
		.select({ value: max(skill.order) })
		.from(skill)
		.then(res => res[0]?.value ?? -1)
}

export const setSkill = async (where: SQL, values: Partial<SkillInsert>) => {
	return env.db
		.update(skill)
		.set(values)
		.where(where)
		.returning()
		.then(res => res[0])
}

export const removeSkill = async (where: SQL) => {
	return env.db
		.delete(skill)
		.where(where)
		.returning()
		.then(res => res[0])
}
