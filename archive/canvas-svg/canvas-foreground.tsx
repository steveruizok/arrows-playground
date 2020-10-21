import * as React from "react"
import state from "../../components/state"

import { useStateDesigner } from "@state-designer/react"
import { IBox } from "../../types"

import Boxes from "./boxes"
import Brush from "./brush"
import BoundingBoxBackground from "./bounding-box/bounding-box-background"
import BoundingBoxOutline from "./bounding-box/bounding-box-outline"

type Props = {
	boxes: IBox[]
	width: number
	height: number
}

export default function CanvasForeground() {
	const local = useStateDesigner(state)

	const { boxes, camera, bounds, brush, selectedBoxIds } = local.data
	const { x, y, zoom } = camera

	const isSelecting = !local.isIn("selectingIdle")
	const isBrushSelecting = local.isIn("brushSelecting")
	const isEditing = local.isIn("editingLabel")

	const mboxes = Object.values(boxes)

	return (
		<g
			transform={`scale(${zoom}) translate(${-x / zoom} ${-y / zoom}) `}
			strokeWidth={1 / camera.zoom}
		>
			{bounds && <BoundingBoxBackground {...bounds} />}
			<Boxes
				boxes={mboxes}
				selectedBoxIds={selectedBoxIds}
				isSelecting={isSelecting}
				isEditing={isEditing}
			/>
			{bounds && selectedBoxIds.length > 0 && !state.isInAny("dragging") && (
				<BoundingBoxOutline {...bounds} zoom={zoom} />
			)}
			{brush && <Brush {...brush} />}
		</g>
	)
}
