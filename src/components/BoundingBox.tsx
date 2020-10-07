import * as React from "react"
import state, { IBounds } from "./state"
import { useStateDesigner } from "@state-designer/react"
import { getPoint } from "./utils"
import Edge from "./Edge"
import Corner from "./Corner"

export default function BoundingBox() {
	const local = useStateDesigner(state)

	const { boundingBox } = local.values

	if (!boundingBox) return null

	const edges = getEdges(boundingBox)
	const corners = getCorners(boundingBox, 2)

	return (
		<g transform={`translate(${boundingBox.x} ${boundingBox.y})`}>
			<rect
				x={-2}
				y={-2}
				width={boundingBox.width + 4}
				height={boundingBox.height + 4}
				stroke="#aaf"
				strokeWidth={2}
				cursor="grab"
				rx={5}
				ry={5}
				fill="rgba(230, 230, 234, 1.000)"
				onPointerDown={(e) => {
					state.send("STARTED_CLICKING_BOUNDING_BOX", getPoint(e))
				}}
				onPointerUp={(e) => {
					state.send("STOPPED_CLICKING_BOUNDING_BOX", getPoint(e))
				}}
				onPointerMove={(e) => {
					if (e.buttons === 1) {
						state.send("DRAGGED_BOUNDING_BOX", getPoint(e))
					}
				}}
				onDoubleClick={(e) => {
					state.send("DOUBLE_CLICKED_BOUNDING_BOX", getPoint(e))
				}}
			/>
			{corners.map(([cx, cy], i) => (
				<Corner
					key={i}
					x={cx}
					y={cy}
					direction={i % 2}
					onPointerDown={(e) => {
						state.send("STARTED_BOUNDS_CORNER_RESIZING", {
							corner: i,
							...getPoint(e),
						})
					}}
					onPointerUp={(e) => {
						state.send("STOPPED_BOUNDS_CORNER_RESIZING", {
							corner: i,
							...getPoint(e),
						})
					}}
				/>
			))}
			{edges.map(([[x1, y1], [x2, y2]], i) => (
				<Edge
					key={i}
					x1={x1}
					y1={y1}
					x2={x2}
					y2={y2}
					direction={i % 2}
					onPointerDown={(e) => {
						state.send("STARTED_BOUNDS_EDGE_RESIZING", {
							edge: i,
							...getPoint(e),
						})
					}}
					onPointerUp={(e) => {
						state.send("STOPPED_BOUNDS_EDGE_RESIZING", {
							edge: i,
							...getPoint(e),
						})
					}}
				/>
			))}
		</g>
	)
}

function getEdges(bounds: IBounds) {
	const { width, height } = bounds
	return [
		[
			[0, 0],
			[width, 0],
		],
		[
			[width, 0],
			[width, height],
		],
		[
			[width, height],
			[0, height],
		],
		[
			[0, height],
			[0, 0],
		],
	]
}

function getCorners(bounds: IBounds, offset = 0) {
	const { width, height } = bounds
	return [
		[0 - offset, 0 - offset],
		[width + offset, 0 - offset],
		[width + offset, height + offset],
		[0 - offset, height + offset],
	]
}
