import * as React from "react"
import state from "../../../components/state"
import { IFrame } from "../../../types"

export default function BoundingBox({ x, y, height, width }: IFrame) {
	return (
		<rect
			x={x - 1}
			y={y - 1}
			rx={5}
			width={width + 2}
			height={height + 2}
			fill="transparent"
			stroke="none"
			onPointerDown={() => state.send("STARTED_DRAGGING_BOUNDS")}
			cursor="grab"
		/>
	)
}
