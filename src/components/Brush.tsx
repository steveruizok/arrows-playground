import * as React from "react"
import { IFrame } from "./state"

type Props = {
	brush: IFrame
}

export default function Brush({ brush }: Props) {
	const { x, y, width, height } = brush
	return (
		<rect
			x={x}
			y={y}
			width={width}
			height={height}
			strokeWidth={1}
			stroke="#ccc"
			fill="rgba(144, 144, 144, .1)"
			pointerEvents="none"
		/>
	)
}
