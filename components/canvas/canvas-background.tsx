import * as React from "react"
import state from "../state"

type Props = {
  size: { width: number; height: number }
}

export default function CanvasBackground({ size: { width, height } }: Props) {
  return (
    <rect
      x={0}
      y={0}
      width={width}
      height={height}
      fill="#efefef"
      onPointerDown={(e) =>
        state.send("STARTED_POINTING_CANVAS", { x: e.clientX, y: e.clientY })
      }
      onPointerUp={(e) =>
        state.send("STOPPED_POINTING_CANVAS", { x: e.clientX, y: e.clientY })
      }
    />
  )
}
