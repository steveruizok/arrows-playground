import * as React from "react"
import throttle from "lodash/throttle"
import state, { IBox } from "./state"
import { useStateDesigner } from "@state-designer/react"
import Corner from "./Corner"
import Node from "./Node"
import Edge from "./Edge"
import { getPoint } from "./utils"

type Props = { box: IBox; isSelected: boolean; isSelecting: boolean }

function Box({ box, isSelected, isSelecting }: Props) {
	const {
		id,
		x,
		y,
		width,
		height,
		label,
		color = "rgba(255, 255, 255, 1)",
	} = box
	const rInput = React.useRef<HTMLDivElement>(null)

	const local = useStateDesigner({
		states: {
			hovering: {
				initial: "notHovered",
				states: {
					hovered: {
						on: { EXITED_BOX: { to: "notHovered" } },
					},
					notHovered: {
						on: { ENTERED_BOX: { to: "hovered" } },
					},
				},
			},
			editing: {
				initial: "notEditing",
				states: {
					isEditing: {
						on: {
							STOPPED_EDITING_LABEL: { to: "editing" },
						},
					},
					notEditing: {
						on: {
							STARTED_EDITING_LABEL: { to: "isEditing" },
						},
					},
				},
			},
			interaction: {
				initial: "idle",
				states: {
					idle: {
						on: {
							STARTED_RESIZING: { to: "resizing" },
							STARTED_BOX_DRAG: { to: "dragging" },
							STARTED_DRAWING_ARROW: { to: "connecting" },
						},
					},
					resizing: {
						on: {
							ENDED_RESIZING: { to: "idle" },
						},
					},
					dragging: {
						on: {
							ENDED_BOX_DRAG: { to: "idle" },
						},
					},
					connecting: {
						on: {
							STOPPED_DRAWING_ARROW: { to: "idle" },
						},
					},
				},
			},
		},
	})

	const isHovered = local.isIn("hovered") && !isSelecting
	const [warn, setWarn] = React.useState(false)

	const checkWarn = React.useCallback(
		(warn: boolean, isDeleting: boolean, isHovered: boolean) => {
			if (!warn && isDeleting && isHovered) {
				setWarn(true)
			} else if (warn && !(isDeleting && isHovered)) {
				setWarn(false)
			}
		},
		[]
	)

	const isEditing = local.isIn("isEditing")

	React.useEffect(() => {
		return state.onUpdate((u) =>
			checkWarn(warn, u.isIn("deleting"), local.isIn("hovered"))
		)
	}, [warn, local, checkWarn])

	React.useEffect(() => {
		checkWarn(warn, state.isIn("deleting"), isHovered)
	}, [checkWarn, isHovered, warn])

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

	return (
		<g
			transform={`translate(${x}, ${y})`}
			onPointerEnter={() => {
				local.send("ENTERED_BOX")
				state.send("ENTERED_BOX", { id })
			}}
			onPointerLeave={() => {
				local.send("EXITED_BOX")
				state.send("EXITED_BOX", { id })
			}}
			onDoubleClick={() => {
				state.send("STARTED_EDITING_LABEL")
				local.send("STARTED_EDITING_LABEL")
			}}
			onPointerDown={(e) => {
				local.send("STARTED_CLICKING_BOX")
				state.send("STARTED_CLICKING_BOX", { id, ...getPoint(e) })
			}}
			onPointerUp={(e) => {
				local.send("STOPPED_CLICKING_BOX")
				state.send("STOPPED_CLICKING_BOX", { id, ...getPoint(e) })
			}}
		>
			<rect
				width={width}
				height={height}
				stroke={"none"}
				rx={4}
				ry={4}
				fill={color}
				opacity={0.8}
			/>
			<rect
				width={width}
				height={height}
				stroke={warn ? "#F00" : isSelected ? "#03F" : "#000"}
				strokeWidth={2}
				rx={4}
				ry={4}
				fill={isEditing ? "rgba(200,200,240,.24)" : "rgba(255, 255, 255, .5)"}
				cursor="grab"
				onMouseUp={(e) => {
					local.send("ENDED_BOX_DRAG")
					state.send("ENDED_BOX_DRAG", { id, ...getPoint(e) })
				}}
				onMouseMove={(e) =>
					state.send("MOVED_BOX_DRAG", { id, ...getPoint(e) })
				}
			/>
			<g opacity={isHovered ? 1 : 0}>
				{getEdges(box).map(([[x1, y1], [x2, y2]], i) => (
					<Edge
						key={i}
						x1={x1}
						y1={y1}
						x2={x2}
						y2={y2}
						direction={i % 2}
						onPointerDown={(e) => {
							local.send("STARTED_EDGE_RESIZING")
							state.send("STARTED_EDGE_RESIZING", {
								id,
								edge: i,
								...getPoint(e),
							})
						}}
						onPointerUp={(e) => {
							local.send("ENDED_EDGE_RESIZING")
							state.send("ENDED_EDGE_RESIZING", {
								id,
								edge: i,
								...getPoint(e),
							})
						}}
					/>
				))}
				{getCorners(box).map(([cx, cy], i) => (
					<Corner
						key={i}
						x={cx}
						y={cy}
						direction={i % 2}
						stroke={warn ? "#F00" : "#000"}
						onPointerDown={(e) => {
							local.send("STARTED_RESIZING")
							state.send("STARTED_RESIZING", {
								id,
								corner: i,
								...getPoint(e),
							})
						}}
						onPointerUp={(e) => {
							local.send("ENDED_RESIZING")
							state.send("ENDED_RESIZING", {
								id,
								corner: i,
								...getPoint(e),
							})
						}}
					/>
				))}
				<Node
					x={width}
					y={height / 2}
					stroke={warn ? "#F00" : "#000"}
					onPointerDown={(e) => {
						local.send("STARTED_CLICKING_ARROW_NODE")
						state.send("STARTED_CLICKING_ARROW_NODE", { id, ...getPoint(e) })
					}}
					onPointerUp={(e) => {
						local.send("STOPPED_CLICKING_ARROW_NODE")
						state.send("STOPPED_CLICKING_ARROW_NODE", { id })
					}}
				/>
			</g>
			<g pointerEvents={isSelected ? "all" : "none"}>
				<foreignObject x="4" y="4" width="12" height="12">
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							borderRadius: 3,
							width: 8,
							height: 8,
							overflow: "hidden",
							border: "2px solid #000",
							opacity: isSelected ? 1 : 0,
						}}
					>
						<input
							type="color"
							defaultValue={color}
							style={{ opacity: 0 }}
							onChange={(e) => sendBoxColor(id, e.currentTarget.value)}
						/>
					</div>
				</foreignObject>
			</g>
			<g pointerEvents={isEditing ? "all" : "none"}>
				<foreignObject x="0" y="0" width={width} height={height}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							padding: 12,
							width: width - 24,
							height: height - 24,
							textAlign: "center",
							fontSize: 13,
							fontWeight: 700,
							color: isEditing ? "#000" : "#333",
						}}
					>
						<div
							ref={rInput}
							style={{ outline: "none", padding: 8 }}
							contentEditable={isEditing}
							onKeyDown={(e) => e.stopPropagation()}
							onBlur={(e) => {
								local.send("STOPPED_EDITING_LABEL")
								state.send("STOPPED_EDITING_LABEL", {
									id,
									value: e.currentTarget.innerText,
								})
							}}
							suppressContentEditableWarning={true}
						>
							{label}
						</div>
					</div>
				</foreignObject>
			</g>
		</g>
	)
}

function getEdges(box: IBox) {
	const { width, height } = box
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

function getCorners(box: IBox) {
	const { width, height } = box
	return [
		[0, 0],
		[width, 0],
		[width, height],
		[0, height],
	]
}

const sendBoxColor = throttle((id: string, color: string) => {
	state.send("CHANGED_BOX_COLOR", {
		color,
		id,
	})
}, 60)

export default React.memo(Box)
