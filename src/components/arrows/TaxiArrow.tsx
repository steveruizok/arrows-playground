import * as React from "react"
import Node from "./Node"
import state, { IArrow } from "./state"
import { getSector } from "./arrows/utils"

type Props = {
	arrow: IArrow
	color: string
	isSelected: boolean
}

function Arrow({ isSelected, color, arrow }: Props) {
	const { id, label, flip, points } = arrow
	// DELETING WARNING #------>

	const [hovered, setHovered] = React.useState(false)

	const [warn, setWarn] = React.useState(false)

	const checkWarn = React.useCallback(() => {
		const isDeleting = state.isIn("deleting")
		if (!warn && isDeleting && hovered) {
			setWarn(true)
		} else if (warn && !(isDeleting && hovered)) {
			setWarn(false)
		}
	}, [warn, hovered])

	// Check for warn when state enters deleting
	React.useEffect(() => {
		return state.onUpdate((u) => checkWarn())
	}, [checkWarn])

	// Check for warn when hovered changes
	React.useEffect(() => {
		checkWarn()
	}, [checkWarn, hovered])

	// KNOB #------>

	const [knobPoint, setKnobPoint] = React.useState<SVGPoint | undefined>(
		undefined
	)

	const rPath = React.useRef<SVGPathElement>(null)

	// Move knob to arrow's center
	React.useEffect(() => {
		const path = rPath.current
		if (!path) return

		const midPoint = path.getPointAtLength(
			path.getTotalLength() * (flip ? 0.4 : 0.5)
		)
		setKnobPoint(midPoint)
	}, [arrow, flip])

	// LABEL #------>

	const rInput = React.useRef<HTMLDivElement>(null)
	const [isEditing, setIsEditing] = React.useState(false)

	React.useEffect(() => {
		const input = rInput.current
		if (!input) return

		if (isEditing) {
			input.focus()
			const { innerText } = input
			if (innerText.length > 0) {
				const selection = document.getSelection()
				selection && selection.collapse(input, 1)
			}
		} else {
			input.blur()
		}
	}, [isEditing])

	// ARROW #------>

	const [sx, sy, cx, cy, ex, ey, ea, sa, ca] = points
	const endAngleAsDegrees = ea * (180 / Math.PI)
	// const centerAngleAsDegrees = ((ca + Math.PI / 2) * (180 / Math.PI)) % 180
	const currentColor = warn ? "#F00" : isSelected ? "#03F" : color

	const xStatus = cx > sx ? "right" : cx > ex ? "left" : "xAligned"
	const yStatus = cy > sy ? "down" : cy > ey ? "up" : "yAligned"

	let path: string

	const sector = getSector(ca)

	switch (xStatus + yStatus) {
		case "rightdown": {
			path = ["M", sx, sy, "L", sx, cy, ex, cy, ex, ey].join(" ")
			break
		}
		case "leftdown": {
			path = ["M", sx, sy, "L", cx, sy, cx, ey, ex, ey].join(" ")
			break
		}
		case "rightup": {
			path = ["M", sx, sy, "L", sx, cy, ex, cy, ex, ey].join(" ")
			break
		}
		case "leftup": {
			path = ["M", sx, sy, "L", cx, sy, cx, ey, ex, ey].join(" ")
			break
		}
	}

	return (
		<g
			stroke={currentColor}
			fill={currentColor}
			strokeWidth={2}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			onClick={() => state.send("CLICKED_ARROW", { id })}
			// onDoubleClick={() => state.send("FLIPPED_SELECTED_ARROW")}
			onDoubleClick={() => {
				setIsEditing(true)
				state.send("STARTED_EDITING_ARROW_LABEL", { id })
			}}
			cursor="pointer"
		>
			<circle cx={sx} cy={sy} r={4} />
			<path
				ref={rPath}
				d={path}
				strokeWidth={12}
				stroke="transparent"
				fill="none"
			/>
			<path d={path} fill="none" mask="url(#Mask)" />
			<polygon
				points="0,-4 8,0, 0,4"
				transform={`translate(${ex},${ey}) rotate(${endAngleAsDegrees})`}
			/>
			{/* {knobPoint && (label.length > 0 || isEditing) && ( */}
			{knobPoint && (
				<g transform={`translate(${knobPoint.x - 100} ${knobPoint.y - 100}) `}>
					<foreignObject
						x="0"
						y="0"
						width={200}
						height={200}
						pointerEvents={isEditing ? "all" : "none"}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								textAlign: "center",
								height: 200,
								color: currentColor,
								fontSize: 13,
								fontWeight: 700,
							}}
						>
							<div
								ref={rInput}
								style={{
									outline: "none",
									padding: "2px 4px 2px 4px",
									backgroundColor: isEditing
										? "rgba(255, 255, 255, 0.9)"
										: "rgba(230, 230, 234, 0.9)",
									borderRadius: 4,
									textShadow:
										"1px 1px rgba(230, 230, 234, 1.000), -1px -1px rgba(230, 230, 234, 1.000)",
								}}
								contentEditable={isEditing}
								onKeyDown={(e) => e.stopPropagation()}
								onBlur={(e) => {
									setIsEditing(false)
									state.send("STOPPED_EDITING_ARROW_LABEL", {
										id,
										value: e.currentTarget.innerText,
									})
								}}
								suppressContentEditableWarning={true}
							>
								{label} {xStatus} {yStatus} {sector}
							</div>
						</div>
					</foreignObject>
				</g>
			)}
		</g>
	)
}

export default React.memo(Arrow)
