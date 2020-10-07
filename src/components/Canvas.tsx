import * as React from "react"
import state, { keyState } from "./state"
import { useStateDesigner } from "@state-designer/react"
import BoundingBox from "./BoundingBox"
import Box from "./Box"
import Arrow from "./Arrow"
import Brush from "./Brush"
import { getPoint } from "./utils"

type Props = {
	width?: number
	height?: number
	children?: React.ReactNode
}

export default function ({ width = 5000, height = 5000 }: Props) {
	const local = useStateDesigner(state)
	const { arrows, boxes, drawing, cloningBoxes } = local.data
	const {
		drawingArrow,
		selectedArrows,
		selectedBoxes,
		boundingBox,
	} = local.values

	const isSelecting = !state.isIn("notSelecting")

	const isPanning = local.isIn("panning")
	React.useEffect(() => {
		if (isPanning) {
			document.body.style.setProperty("cursor", "grab")
		} else {
			document.body.style.setProperty("cursor", "inherit")
		}
	}, [isPanning])

	return (
		<svg viewBox={`0,0,${5000},${5000}"`} width={5000} height={5000}>
			<rect
				x={0}
				y={0}
				width={width}
				height={height}
				fill="rgba(230, 230, 234, 1.000)"
				onPointerUp={() => state.send("STOPPED_CLICKING_CANVAS")}
				onPointerDown={() => {
					state.send("STARTED_CLICKING_CANVAS")
				}}
			/>
			<BoundingBox/>
			{boxes.map((box) => (
				<Box
					key={box.id}
					box={box}
					isSelected={selectedBoxes.includes(box)}
					isSelecting={isSelecting}
				/>
			))}
			{arrows.map(
				(arrow, i) =>
					arrow && (
						<Arrow
							key={i}
							isSelected={selectedArrows.includes(arrow)}
							arrow={arrow}
						/>
					)
			)}
			{local.isIn("creatingArrow") && drawingArrow && (
				<Arrow
					isSelected={true}
					arrow={{
						from: "-1",
						to: "-1",
						id: "temp",
						label: "",
						flip: false,
						points: drawingArrow,
					}}
				/>
			)}
			{local.isIn("drawingBox") && (
				<Box isSelected={true} box={drawing.box} isSelecting={true} />
			)}
			{local.isIn("cloning") &&
				cloningBoxes.map((box) => (
					<Box key={box.id} isSelected={false} box={box} isSelecting={true} />
				))}
			{local.isIn("drawingBrush") && <Brush brush={drawing.brush} />}
		</svg>
	)
}
