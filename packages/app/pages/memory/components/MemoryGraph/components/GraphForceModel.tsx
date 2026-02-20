import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, Html } from '@react-three/drei'
// @ts-ignore
import * as THREE from 'three'
// @ts-ignore
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceX, forceY, forceZ } from 'd3-force-3d'

import { memo } from '@/utils'

interface GraphForceModelProps {
	nodes: Array<{
		id: string
		label: string
		activation: number
		potential: number
	}>
	edges: Array<{
		source_id: string
		target_id: string
		weight: number
		distance: number
		type?: string | null
	}>
	onSelect?: (info: string) => void
}

const colorCold = new THREE.Color('#3b82f6')
const colorHot = new THREE.Color('#ef4444')
const tempColor = new THREE.Color()

const GraphForceModel = ({ nodes: initialNodes, edges: initialEdges, onSelect }: GraphForceModelProps) => {
	const nodesRef = useRef<Array<THREE.Mesh | null>>([])
	const linksRef = useRef<Array<any>>([])
	const edgeLabelsRef = useRef<Array<THREE.Group | null>>([])

	const simulation = useMemo(() => {
		// Deep copy to prevent d3 from mutating the original props
		const nodes = initialNodes.map(d => ({
			...d,
			x: (Math.random() - 0.5) * 100,
			y: (Math.random() - 0.5) * 100,
			z: (Math.random() - 0.5) * 100,
			vx: 0,
			vy: 0,
			vz: 0
		}))
		const links = initialEdges.map(d => ({ ...d, source: d.source_id, target: d.target_id }))

		const sim = forceSimulation(nodes, 3)
			.force('charge', forceManyBody().strength(-200))
			.force('center', forceCenter(0, 0, 0))
			.force(
				'link',
				forceLink(links)
					.id((d: any) => d.id)
					.distance((link: any) => (link.distance || 1) * 50)
			)

		return { sim, nodes, links }
	}, [initialNodes, initialEdges])

	useFrame(() => {
		simulation.sim.tick()

		simulation.nodes.forEach((node: any, i: number) => {
			if (nodesRef.current[i]) {
				nodesRef.current[i]!.position.set(node.x, node.y, node.z)
			}
		})

		simulation.links.forEach((link: any, i: number) => {
			if (linksRef.current[i]) {
				linksRef.current[i].geometry.setPositions([
					link.source?.x || 0,
					link.source?.y || 0,
					link.source?.z || 0,
					link.target?.x || 0,
					link.target?.y || 0,
					link.target?.z || 0
				])
			}
			if (edgeLabelsRef.current[i]) {
				// Calculate midpoint for the label
				const midX = ((link.source?.x || 0) + (link.target?.x || 0)) / 2
				const midY = ((link.source?.y || 0) + (link.target?.y || 0)) / 2
				const midZ = ((link.source?.z || 0) + (link.target?.z || 0)) / 2
				edgeLabelsRef.current[i]!.position.set(midX, midY, midZ)
			}
		})
	})

	return (
		<group>
			{simulation.links.map((link: any, index: number) => {
				const linkLabel = `${link.type || 'edge'} | w:${link.weight.toFixed(2)} d:${link.distance.toFixed(2)}`

				return (
					<group key={`link-group-${index}`}>
						<Line
							// @ts-ignore
							ref={(el: any) => (linksRef.current[index] = el)}
							points={[
								[0, 0, 0],
								[0, 0, 0]
							]}
							color='#aaa'
							opacity={0.4}
							transparent
							lineWidth={Math.min(Math.max(link.weight * 2, 2), 6)}
							onClick={e => {
								e.stopPropagation()
								if (onSelect) onSelect(`Edge: ${linkLabel}`)
							}}
							onPointerOver={e => {
								e.stopPropagation()
								document.body.style.cursor = 'pointer'
							}}
							onPointerOut={e => {
								e.stopPropagation()
								document.body.style.cursor = 'auto'
							}}
						/>
						<group ref={el => (edgeLabelsRef.current[index] = el)}>
							<Html center className='pointer-events-none'>
								<div
									className='pointer-events-auto cursor-pointer rounded border border-slate-200 bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-slate-100'
									onClick={e => {
										e.stopPropagation()
										if (onSelect) onSelect(`Edge: ${linkLabel}`)
									}}
								>
									{link.type || 'edge'}
								</div>
							</Html>
						</group>
					</group>
				)
			})}

			{simulation.nodes.map((node: any, index: number) => {
				const nodeColor = tempColor.copy(colorCold).lerp(colorHot, node.activation)
				// Size based on potential or fixed size. Multiply to scale appropriately in 3D
				const nodeSize = Math.max((node.potential || 1) * 3, 2)

				return (
					<mesh
						key={node.id}
						ref={el => (nodesRef.current[index] = el)}
						scale={nodeSize}
						onClick={e => {
							e.stopPropagation()
							if (onSelect)
								onSelect(
									`Node ${node.id}: ${node.label}\nA:${node.activation.toFixed(2)} P:${node.potential.toFixed(2)}`
								)
						}}
						onPointerOver={e => {
							e.stopPropagation()
							document.body.style.cursor = 'pointer'
						}}
						onPointerOut={e => {
							e.stopPropagation()
							document.body.style.cursor = 'auto'
						}}
					>
						<sphereGeometry args={[1, 16, 16]} />
						<meshStandardMaterial color={nodeColor} roughness={0.2} metalness={0.1} />
						<Html center className='pointer-events-none mt-4'>
							<div className='rounded bg-black/60 px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-lg backdrop-blur-md'>
								{node.label}
							</div>
						</Html>
					</mesh>
				)
			})}
		</group>
	)
}

export default memo(GraphForceModel)
