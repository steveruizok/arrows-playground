import { memo, useState, useRef, useEffect } from "react"
import Surface, { HitType } from "./surface"
import state from "../state"

// const hitEvents: Record<HitType, string> = {
// 	[HitType.Bounds]: "STARTED_POINTING_BOUNDS",
// 	[HitType.BoundEdge]: "STARTED_POINTING_BOUNDS_EDGE",
// 	[HitType.BoundCorner]: "STARTED_POINTING_BOUNDS_CORNER",
// 	[HitType.Box]: "STARTED_POINTING_BOX",
// 	[HitType.Canvas]: "STARTED_POINTING_CANVAS",
// }

type Props = React.HTMLProps<HTMLCanvasElement> & {
	width: number
	height: number
}

function Canvas({ width, height, ...rest }: Props) {
	const rSurface = useRef<Surface>(null)
	const rCanvas = useRef<HTMLCanvasElement>(null)

	const dpr = window.devicePixelRatio || 1

	useEffect(() => {
		if (rSurface.current) rSurface.current.destroy()
		const canvas = rCanvas.current
		rSurface.current = new Surface(canvas)

		state.send("UPDATED_SURFACE", rSurface.current)
	}, [rCanvas, width, height])

	function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
		const { deltaX, deltaY } = e

		if (e.ctrlKey) {
			// Zooming
			state.send("ZOOMED", deltaY / 100)
			state.send("MOVED_POINTER")
		} else {
			// Panning
			state.send("PANNED", {
				x: deltaX,
				y: deltaY,
			})
			state.send("MOVED_POINTER")
		}
	}

	return (
		<div
			style={{
				width,
				height,
				overflow: "hidden",
			}}
			onWheel={handleWheel}
			onPointerDown={(e) => {
				const hit = rSurface.current.hitTest()

				switch (hit.type) {
					case "bounds": {
						state.send("STARTED_POINTING_BOUNDS")
						break
					}
					case "box": {
						state.send("STARTED_POINTING_BOX", { id: hit.id })
						break
					}
					case "bounds-corner": {
						state.send("STARTED_POINTING_BOUNDS_CORNER", hit.corner)
						break
					}
					case "bounds-edge": {
						state.send("STARTED_POINTING_BOUNDS_EDGE", hit.edge)
						break
					}
					case "canvas": {
						state.send("STARTED_POINTING_CANVAS")
						break
					}
				}
			}}
			onPointerMove={(e) =>
				state.send("MOVED_POINTER", { x: e.clientX, y: e.clientY })
			}
			onPointerUp={(e) =>
				state.send("STOPPED_POINTING", { x: e.clientX, y: e.clientY })
			}
		>
			<canvas
				ref={rCanvas}
				width={width * dpr}
				height={height * dpr}
				style={{
					transformOrigin: "top left",
					transform: `scale(${1 / dpr})`,
				}}
			/>
		</div>
	)
}

export default memo(Canvas)
