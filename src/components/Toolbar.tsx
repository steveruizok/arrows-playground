import * as React from "react"
import state from "./state"
import { useStateDesigner } from "@state-designer/react"

export default function Toolbar() {
	const local = useStateDesigner(state)

	const hasSelection = local.data.selection.length > 0
	const hasSelectedBox = local.values.selectedBoxes.length > 0
	const hasSelectedBoxes = local.values.selectedBoxes.length > 1

	return (
		<div
			className="button-group"
			style={{ position: "absolute", top: 8, left: 8 }}
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
			{hasSelectedBox && (
				<>
					<Divider />
					<IconButton
						src="arrow.svg"
						event="STARTED_PICKING_ARROW"
						shortcut="A"
					/>
				</>
			)}

			{hasSelection && (
				<>
					<IconButton src="delete.svg" event="DELETED_SELECTED" shortcut="⌫" />
					<IconButton
						src="flip-arrow.svg"
						event="FLIPPED_SELECTED_ARROW"
						shortcut="/"
					/>
				</>
			)}
			{hasSelectedBoxes && (
				<>
					<Divider />
					<IconButton src="left.svg" event="ALIGNED_LEFT" />
					<IconButton src="center-x.svg" event="ALIGNED_CENTER_X" />
					<IconButton src="right.svg" event="ALIGNED_RIGHT" />
					<IconButton src="top.svg" event="ALIGNED_TOP" />
					<IconButton src="center-y.svg" event="ALIGNED_CENTER_Y" />
					<IconButton src="bottom.svg" event="ALIGNED_BOTTOM" />
					<Divider />
					<IconButton src="distribute-x.svg" event="DISTRIBUTED_X" />
					<IconButton src="distribute-y.svg" event="DISTRIBUTED_Y" />
				</>
			)}
			{hasSelectedBoxes && <div></div>}
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
			}}
			type="button"
			onClick={() => state.send(event)}
		>
			{shortcut && <Key>{shortcut}</Key>}
		</button>
	)
}
