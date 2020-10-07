import * as React from "react"
import state from "./state"
import { useStateDesigner } from "@state-designer/react"

export default function Toolbar() {
	const local = useStateDesigner(state)

	const hasSelection = local.data.selection.length > 0
	const hasSelectedBox = local.values.selectedBoxes.length > 0
	const hasSelectedBoxes = local.values.selectedBoxes.length > 1
	const hasManySelectedBoxes = local.values.selectedBoxes.length > 2

	return (
		<div
			className="button-group"
			style={{
				position: "absolute",
				top: 8,
				left: 0,
				userSelect: "none",
			}}
			onClick={(e) => e.stopPropagation()}
		>
			<IconButton
				src="select.svg"
				isActive={local.isIn("selecting")}
				event="SELECTED_SELECT_TOOL"
				shortcut="V"
			/>
			<IconButton
				src="box.svg"
				isActive={local.isIn("drawing")}
				onClick={() => state.send("SELECTED_BOX_TOOL")}
				event="SELECTED_BOX_TOOL"
				shortcut="F"
			/>
			<Divider />
			<IconButton
				src="arrow.svg"
				event="STARTED_PICKING_ARROW"
				shortcut="A"
				disabled={!hasSelectedBox}
			/>
			<IconButton
				src="delete.svg"
				event="DELETED_SELECTED"
				shortcut="⌫"
				disabled={!hasSelection}
			/>
			<IconButton
				src="flip-arrow.svg"
				event="FLIPPED_ARROWS"
				shortcut="T"
				disabled={!hasSelection}
			/>
			<IconButton
				src="invert-arrow.svg"
				event="INVERTED_ARROWS"
				shortcut="R"
				disabled={!hasSelection}
			/>
			<Divider />
			<IconButton
				src="left.svg"
				event="ALIGNED_LEFT"
				disabled={!hasSelectedBoxes}
				shortcut=";"
			/>
			<IconButton
				src="center-x.svg"
				event="ALIGNED_CENTER_X"
				disabled={!hasSelectedBoxes}
				shortcut="'"
			/>
			<IconButton
				src="right.svg"
				event="ALIGNED_RIGHT"
				disabled={!hasSelectedBoxes}
				shortcut="\"
			/>
			<IconButton
				src="top.svg"
				event="ALIGNED_TOP"
				disabled={!hasSelectedBoxes}
				shortcut="⇧ ;"
			/>
			<IconButton
				src="center-y.svg"
				event="ALIGNED_CENTER_Y"
				disabled={!hasSelectedBoxes}
				shortcut="⇧ '"
			/>
			<IconButton
				src="bottom.svg"
				event="ALIGNED_BOTTOM"
				disabled={!hasSelectedBoxes}
				shortcut="⇧ \"
			/>
			<Divider />
			<IconButton
				src="stretch-x.svg"
				event="STRETCHED_X"
				disabled={!hasSelectedBoxes}
				shortcut="⇧ ["
			/>
			<IconButton
				src="stretch-y.svg"
				event="STRETCHED_Y"
				disabled={!hasSelectedBoxes}
				shortcut="⇧ ]"
			/>

			<Divider />
			<IconButton
				src="distribute-x.svg"
				event="DISTRIBUTED_X"
				disabled={!hasManySelectedBoxes}
			/>
			<IconButton
				src="distribute-y.svg"
				event="DISTRIBUTED_Y"
				disabled={!hasManySelectedBoxes}
			/>
			<span className="spacer" style={{ gridColumn: 21 }} />
			<IconButton
				className="rightAlign"
				src="undo.svg"
				event="UNDO"
				shortcut="⌘ Z"
				disabled={local.data.undos.length === 1}
				style={{ gridColumn: 22 }}
			/>
			<IconButton
				className="rightAlign"
				src="redo.svg"
				event="REDO"
				shortcut="⌘ ⇧ Z"
				disabled={local.data.redos.length === 0}
				style={{ gridColumn: 23 }}
			/>
		</div>
	)
}

function Key({ children }: { children: React.ReactNode }) {
	return (
		<span
			className="button-key"
			style={{
				position: "relative",
				top: "calc(100%)",
				left: 0,
				padding: 4,
				fontSize: 12,
				fontWeight: "bold",
				backgroundColor: "#ccc",
			}}
		>
			{children}
		</span>
	)
}

function Divider() {
	return (
		<span
			style={{
				padding: 4,
				color: "rgba(0,0,0,.5)",
			}}
		>
			|
		</span>
	)
}

type IconButtonProps = {
	event: string
	isActive?: boolean
	src: string
	shortcut?: string
} & React.HTMLProps<HTMLButtonElement>

function IconButton({
	event = "",
	isActive = false,
	src,
	shortcut,
	children,
	...props
}: IconButtonProps) {
	return (
		<button
			{...props}
			style={{
				height: 40,
				width: 40,
				padding: 0,
				backgroundImage: `url(/${src})`,
				backgroundSize: "cover",
				backgroundColor: isActive ? "#ccc" : "#fff",
				opacity: props.disabled ? 0.5 : 1,
				gridRow: 1,
				transition: "opacity .16s",
				...props.style,
			}}
			type="button"
			onClick={() => state.send(event)}
		>
			{shortcut && <Key>{shortcut}</Key>}
		</button>
	)
}
