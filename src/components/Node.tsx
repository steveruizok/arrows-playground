import * as React from "react"

type Props = { x: number; y: number } & React.SVGProps<SVGGElement>

function Node({ x, y, ...props }: Props) {
	return (
		<g
			transform={`translate(${x}, ${y})`}
			fill="#0CF"
			cursor="pointer"
			{...props}
		>
			<circle
				r={12}
				cx={0}
				cy={0}
				fill="transparent"
				stroke="none"
				strokeWidth={2}
			/>
			<circle r={4} cx={0} cy={0} strokeWidth={2} />
		</g>
	)
}

export default React.memo(Node)
