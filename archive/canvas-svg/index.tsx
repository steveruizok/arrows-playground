import state from "../../components/state"
import NoSSR from "react-no-ssr"
import CanvasBackground from "./canvas-background"
import CanvasForeground from "./canvas-foreground"

type Props = { width: number; height: number }

export function CanvasSvg({ width, height }: Props) {
	function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
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
		<NoSSR>
			<svg
				viewBox={`0 0 ${width} ${height}`}
				style={{ userSelect: "none" }}
				onWheel={handleWheel}
			>
				<CanvasBackground size={{ width, height }} />
				<CanvasForeground />
			</svg>
		</NoSSR>
	)
}
