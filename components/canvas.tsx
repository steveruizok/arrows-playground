import * as React from "react"
import state from "./state"
import NoSSR from "react-no-ssr"

import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox from "./hooks/useViewBox"

import CanvasBackground from "./canvas/canvas-background"
import CanvasForeground from "./canvas/canvas-foreground"
import ZoomIndicator from "./overlays/zoom-indicator"
import Positions from "./overlays/positions"

export default function Canvas() {
  const { ref, width, height } = useViewBox()

  useWindowEvents()

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

  const [showPositions, setShowPositions] = React.useState(true)

  return (
    <div
      ref={ref}
      style={{
        width: "100vw",
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
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
      <div style={{ position: "absolute", bottom: 8, left: 8 }}>
        {showPositions && <Positions />}
        <button
          style={{ marginTop: 8 }}
          onClick={() => setShowPositions(!showPositions)}
        >
          {showPositions ? "Hide" : "Show"}
        </button>
      </div>
      <ZoomIndicator />
    </div>
  )
}
