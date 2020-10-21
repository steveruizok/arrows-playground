type Props = React.SVGProps<SVGLineElement> & {
	direction: number
	zoom: number
}

export default function Edge({ direction, zoom, ...props }: Props) {
	return (
		<line
			strokeWidth={8}
			stroke={"transparent"}
			cursor={["ns-resize", "ew-resize"][direction]}
			{...props}
		/>
	)
}
