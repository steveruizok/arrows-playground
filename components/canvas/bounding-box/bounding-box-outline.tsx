import * as React from "react"
import state from "../../state"
import { IBounds } from "../../../types"
import Corner from "./corner"
import Edge from "./edge"

function getEdges(width: number, height: number) {
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

function getCorners(width: number, height: number, offset = 0) {
  return [
    [0 - offset, 0 - offset],
    [width + offset, 0 - offset],
    [width + offset, height + offset],
    [0 - offset, height + offset],
  ]
}

export default function BoundingBox({
  x,
  y,
  width,
  height,
  zoom,
}: IBounds & { zoom: number }) {
  const offset = 1 / zoom

  const edges = getEdges(width, height)
  const corners = getCorners(width, height, 2)

  return (
    <g transform={`translate(${x - offset} ${y - offset})`}>
      <rect
        width={width + offset * 2}
        height={height + offset * 2}
        fill="none"
        stroke="rgba(0,100,200, 1)"
        cursor="grab"
      />
      {edges.map(([[x1, y1], [x2, y2]], i) => (
        <Edge
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          direction={i % 2}
          onPointerDown={() => state.send("STARTED_POINTING_BOUNDS_EDGE", i)}
        />
      ))}
      {corners.map(([cx, cy], i) => (
        <Corner
          key={i}
          x={cx}
          y={cy}
          direction={i % 2}
          onPointerDown={() => state.send("STARTED_POINTING_BOUNDS_CORNER", i)}
        />
      ))}
    </g>
  )
}
