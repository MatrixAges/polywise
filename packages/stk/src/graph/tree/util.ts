import type { Node } from './types'

const _mix = <Base, Source>(dist: Base & Source, obj: Source) => {
	for (const key in obj) {
		if (obj.hasOwnProperty(key) && key !== 'constructor' && obj[key] !== undefined) {
			;(<any>dist)[key] = obj[key]
		}
	}
}

export const mix = <Base, A, B, C>(dist: Base & A & B & C, src1?: A, src2?: B, src3?: C): Base & A & B & C => {
	if (src1) _mix(dist, src1)
	if (src2) _mix(dist, src2)
	if (src3) _mix(dist, src3)

	return dist
}

export const getHeight = (
	prev_node: Node,
	current_node: Node,
	align: 'center' | undefined,
	height_field = 'height'
) => {
	return align === 'center' ? (prev_node[height_field] + current_node[height_field]) / 2 : prev_node.height
}
