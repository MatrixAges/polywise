import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Line, Text, Billboard, Environment } from '@react-three/drei'
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

const nodeMaterial = new THREE.MeshStandardMaterial({
	color: 'white',
	roughness: 0.1,
	metalness: 0.1,
	envMapIntensity: 1
})

const GraphForceModel = ({ nodes: initialNodes, edges: initialEdges, onSelect }: GraphForceModelProps) => {
	const nodesRef = useRef<Array<THREE.Group | null>>([])
	const linksRef = useRef<Array<any>>([])
	const edgeTextRefs = useRef<Array<THREE.Mesh | null>>([])

	const { camera } = useThree()

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
			if (edgeTextRefs.current[i]) {
				const vSource = new THREE.Vector3(link.source?.x || 0, link.source?.y || 0, link.source?.z || 0)
				const vTarget = new THREE.Vector3(link.target?.x || 0, link.target?.y || 0, link.target?.z || 0)

				const mid = vSource.clone().lerp(vTarget, 0.5)
				edgeTextRefs.current[i]!.position.copy(mid)

				edgeTextRefs.current[i]!.quaternion.copy(camera.quaternion)

				const p1 = vSource.clone().project(camera)
				const p2 = vTarget.clone().project(camera)
				// @ts-ignore
				const aspect = camera.aspect || 1
				const dx = p2.x - p1.x
				const dy = (p2.y - p1.y) / aspect

				if (dx === 0 && dy === 0) return

				let angle = Math.atan2(dy, dx)
				if (angle > Math.PI / 2) angle -= Math.PI
				else if (angle < -Math.PI / 2) angle += Math.PI

				edgeTextRefs.current[i]!.rotateZ(angle)
				edgeTextRefs.current[i]!.translateZ(2)
			}
		})
	})

	return (
		<group>
			<Environment preset='city' />
			{simulation.links.map((link: any, index: number) => {
				const expectedDist = (link.distance || 1) * 50
				const maxChars = Math.max(4, Math.floor((expectedDist * 0.6) / 1.5))
				let truncatedLabel = link.type || 'edge'
				if (truncatedLabel.length > maxChars) {
					truncatedLabel = truncatedLabel.substring(0, maxChars) + '...'
				}

				return (
					<group key={`link-group-${index}`}>
						<Line
							// @ts-ignore
							ref={(el: any) => (linksRef.current[index] = el)}
							points={[
								[0, 0, 0],
								[0, 0, 0]
							]}
							color='#94a3b8'
							opacity={0.5}
							transparent
							lineWidth={Math.min(Math.max(link.weight * 2, 2), 6)}
						/>
						<Text
							ref={el => {
								edgeTextRefs.current[index] = el as any
							}}
							fontSize={2.5}
							color='#64748b'
							fontWeight={100}
							anchorY='bottom'
							anchorX='center'
							outlineWidth={0.1}
							outlineColor='#ffffff'
							onClick={e => {
								e.stopPropagation()
								if (onSelect)
									onSelect(
										`Edge: ${link.type || 'edge'} | w:${link.weight.toFixed(2)} d:${link.distance.toFixed(2)}`
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
							{truncatedLabel}
						</Text>
					</group>
				)
			})}

			{simulation.nodes.map((node: any, index: number) => {
				const nodeSize = Math.max((node.potential || 0) * 12 + 8, 8)

				return (
					<group
						key={node.id}
						ref={el => (nodesRef.current[index] = el as any)}
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
						<mesh scale={nodeSize} material={nodeMaterial}>
							<sphereGeometry args={[1, 32, 32]} />
						</mesh>
						<Billboard position={[0, -nodeSize - 2, 0]}>
							<Text
								fontSize={4}
								color='#334155'
								fontWeight={100}
								anchorY='top'
								anchorX='center'
								outlineWidth={0.15}
								outlineColor='#ffffff'
							>
								{node.label}
							</Text>
						</Billboard>
					</group>
				)
			})}
		</group>
	)
}

export default memo(GraphForceModel)
