type Props = React.SVGProps<SVGGElement> & {
	direction: number
	zoom: number
}

export default function Corner({ x, y, direction, zoom, ...props }: Props) {
	return (
		<g
			transform={`translate(${x}, ${y})`}
			cursor={["nwse-resize", "nesw-resize"][direction % 2]}
			{...props}
		>
			<circle cx={0} cy={0} r={4 / zoom} fill="#0274ff" strokeWidth={2} />
			<circle cx={0} cy={0} r={12} fill="transparent" stroke="none" />
		</g>
	)
}
