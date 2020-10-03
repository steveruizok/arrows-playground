import * as React from "react"
import clamp from "lodash/clamp"
import { motion, useMotionValue, PanInfo } from "framer-motion"
import useResizeObserver from "use-resize-observer"
import Canvas from "./Canvas"
import state, { keyState } from "./state"
import { getPoint } from "./utils"
type Props = {}

const CANVAS_WIDTH = 5000,
	CANVAS_HEIGHT = 5000,
	MIN_ZOOM = 0.25,
	MAX_ZOOM = 1

let scrollX = 0,
	scrollY = 0

export default React.forwardRef<HTMLDivElement>((props: Props, rCanvas) => {
	const scale = useMotionValue(1)
	const rScaleInput = React.useRef<HTMLInputElement>()
	const transformOrigin = useMotionValue("top 0px left 0px")
	const { ref, width, height } = useResizeObserver<HTMLDivElement>()

	// When viewport changes, update scale, scroll and viewport.
	React.useEffect(() => {
		const container = ref.current
		if (!container) return
		const x = (CANVAS_WIDTH - width) / 2,
			y = (CANVAS_HEIGHT - height) / 2

		container.scrollTo(x, y)
		state.send("SCALED", { scale: scale.get() })
		state.send("UPDATED_VIEWPORT", { width, height })
		state.send("SCROLLED", { x, y })
	}, [ref, width, height, scale])

	// Prevent 2-finger pinching.
	React.useEffect(() => {
		const container = ref.current
		if (!container) return

		function preventTouchZooming(e: WheelEvent) {
			if (e.ctrlKey) e.preventDefault()
		}

		container.addEventListener("wheel", preventTouchZooming, {
			passive: false,
		})
		container.addEventListener("touchmove", preventTouchZooming, {
			passive: false,
		})
		return () => {
			container.removeEventListener("wheel", preventTouchZooming)
			container.removeEventListener("touchmove", preventTouchZooming)
		}
	}, [ref])

	function handleWheel(e: React.WheelEvent) {
		if (e.metaKey) {
			let value = clamp(scale.get() + e.deltaY * -0.001, MIN_ZOOM, MAX_ZOOM)
			scale.set(value)
			state.send("SCALED", { scale: value })
			e.stopPropagation()
		}
	}

	function handleScroll(e: React.UIEvent) {
		if (keyState.isIn("meta")) {
			ref.current.scrollTo(scrollX, scrollY)
			return
		}

		const { scrollLeft: x, scrollTop: y } = e.currentTarget

		scrollX = x
		scrollY = y
		transformOrigin.set(`${x + width / 2}px ${y + width / 2}px`)
		state.send("SCROLLED", { x, y })
	}

	function handleScale(e: React.ChangeEvent<HTMLInputElement>) {
		state.send("SCALED", { scale: e.currentTarget.value })
		scale.set(parseFloat(e.currentTarget.value))
	}

	function handlePan(e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
		if (keyState.isIn("space")) {
			const container = ref.current
			if (!container) return
			const { scrollLeft: x, scrollTop: y } = container
			container.scrollTo(
				x - info.delta.x / scale.get(),
				y - info.delta.y / scale.get()
			)
		}
	}

	React.useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			switch (e.key) {
				case "r": {
					state.send("INVERTED_ARROWS")
					break
				}
				case "a": {
					state.send("STARTED_PICKING_ARROW")
					break
				}
				case "Shift": {
					keyState.send("PRESSED_SHIFT")
					break
				}
				case "Control": {
					keyState.send("PRESSED_CONTROL")
					break
				}
				case " ": {
					keyState.send("PRESSED_SPACE")
					break
				}
				case "Meta": {
					keyState.send("PRESSED_META")
					break
				}
				case "Alt": {
					keyState.send("PRESSED_ALT")
					state.send("TOGGLED_ALT_MODE")
					break
				}
				case "Escape": {
					state.send("CANCELLED")
					break
				}
				case "f": {
					state.send("SELECTED_BOX_TOOL")
					break
				}
				case "v": {
					state.send("SELECTED_SELECT_TOOL")
					break
				}
			}
		}

		function handleKeyUp(e: KeyboardEvent) {
			switch (e.key) {
				case "Shift": {
					keyState.send("RELEASED_SHIFT")
					break
				}
				case "Control": {
					keyState.send("RELEASED_CONTROL")
					break
				}
				case "Meta": {
					keyState.send("RELEASED_META")
					break
				}
				case "Alt": {
					keyState.send("RELEASED_ALT")
					state.send("TOGGLED_ALT_MODE")
					break
				}
				case " ": {
					keyState.send("RELEASED_SPACE")
					break
				}
				case "Backspace": {
					state.send("DELETED_SELECTION")
					break
				}
				case "/": {
					state.send("FLIPPED_SELECTED_ARROW")
					break
				}
			}
		}

		document.body.addEventListener("keydown", handleKeyDown)
		document.body.addEventListener("keyup", handleKeyUp)
		document.body.addEventListener("keypress", handleKeyPress)
		return () => {
			document.body.removeEventListener("keydown", handleKeyDown)
			document.body.removeEventListener("keyup", handleKeyUp)
		}
	})

	return (
		<motion.div
			ref={ref}
			style={{
				width: "100vw",
				height: "100vh",
				overflow: "scroll",
				backgroundColor: "rgba(220, 220, 224, 1.000)",
			}}
			onWheel={handleWheel}
			onScrollCapture={handleScroll}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			onPointerMove={handlePointerMove}
			onPan={handlePan}
		>
			<div style={{ width: 5000, height: 5000 }}>
				<motion.div
					ref={rCanvas}
					style={{
						scale,
						transformOrigin,
					}}
				>
					<Canvas />
				</motion.div>
			</div>
			<input
				ref={rScaleInput}
				type="range"
				min={MIN_ZOOM}
				max={MAX_ZOOM}
				step="0.01"
				style={{ position: "absolute", bottom: 32, left: 0, zIndex: 999 }}
				onChange={handleScale}
				defaultValue={1}
			/>
		</motion.div>
	)
})

function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
	state.send("DOWNED_POINTER", getPoint(e))
}
function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
	state.send("RAISED_POINTER", getPoint(e))
}

function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
	state.send("MOVED_POINTER", getPoint(e))
	if (e.buttons === 1) {
		state.send("DRAGGED_POINTER", getPoint(e))
	}
}

function handleKeyPress(e: KeyboardEvent) {
	switch (e.key) {
		case " ": {
			if (!state.isInAny("editingLabel", "editingArrowLabel")) {
				e.preventDefault()
			}
			break
		}
	}
}
