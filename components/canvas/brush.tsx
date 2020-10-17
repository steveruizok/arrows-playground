import * as React from "react"
import * as I from "../../types"

type Props = I.Brush

export default function Brush({ x0, y0, x1, y1 }: Props) {
	return (
		<rect
			x={Math.min(x0, x1)}
			y={Math.min(y0, y1)}
			width={Math.abs(x1 - x0)}
			height={Math.abs(y1 - y0)}
			fill="rgba(0,0,100, .1)"
			stroke="rgba(0,0,100, .2)"
			strokeWidth={1}
		/>
	)
}
