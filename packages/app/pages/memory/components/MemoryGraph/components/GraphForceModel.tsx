import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
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
		})
	})

	console.log(simulation)

	return (
		<group>
			{simulation.links.map((link: any, index: number) => (
				<Line
					key={`link-${index}`}
					// @ts-ignore
					ref={(el: any) => (linksRef.current[index] = el)}
					points={[
						[0, 0, 0],
						[0, 0, 0]
					]}
					color='#aaa'
					opacity={0.4}
					transparent
					lineWidth={Math.min(Math.max(link.weight, 1), 5)}
					onClick={e => {
						e.stopPropagation()
						if (onSelect)
							onSelect(
								`Edge: ${link.type || 'edge'} | w:${link.weight.toFixed(2)} d:${link.distance.toFixed(2)}`
							)
					}}
				/>
			))}

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
					>
						<sphereGeometry args={[1, 16, 16]} />
						<meshStandardMaterial color={nodeColor} roughness={0.2} metalness={0.1} />
					</mesh>
				)
			})}
		</group>
	)
}

export default memo(GraphForceModel)
