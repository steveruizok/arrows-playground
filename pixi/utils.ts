import Box from "./shapes/box"
import * as Types from "./types"

// Bounds

export class Bounds {
  static pointsToBounds(a: Types.Point, b: Types.Point): Types.Bounds {
    return {
      id: 0,
      minX: Math.min(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxX: Math.max(a.x, b.x),
      maxY: Math.max(a.y, b.y),
    }
  }

  static pointToBounds(point: Types.Point): Types.Bounds {
    return {
      id: 0,
      minX: point.x - 0.5,
      minY: point.y - 0.5,
      maxX: point.x + 0.5,
      maxY: point.y + 0.5,
    }
  }

  static boxToBounds(box: Types.Box | Types.Frame) {
    return {
      id: (box as Types.Box).id || "anon",
      minX: box.x,
      minY: box.y,
      maxX: box.x + box.width,
      maxY: box.y + box.height,
    }
  }

  static extend(a: Types.Bounds, b: Types.Bounds) {
    a.minX = Math.min(a.minX, b.minX)
    a.minY = Math.min(a.minY, b.minY)
    a.maxX = Math.max(a.maxX, b.maxX)
    a.maxY = Math.max(a.maxY, b.maxY)
    return a
  }

  static enlargedArea(a: Types.Bounds, b: Types.Bounds) {
    return (
      (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) *
      (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY))
    )
  }

  static intersectionArea(a: Types.Bounds, b: Types.Bounds) {
    const minX = Math.max(a.minX, b.minX)
    const minY = Math.max(a.minY, b.minY)
    const maxX = Math.min(a.maxX, b.maxX)
    const maxY = Math.min(a.maxY, b.maxY)

    return Math.max(0, maxX - minX) * Math.max(0, maxY - minY)
  }

  static contains(a: Types.Bounds, b: Types.Bounds) {
    return (
      a.minX <= b.minX &&
      a.minY <= b.minY &&
      b.maxX <= a.maxX &&
      b.maxY <= a.maxY
    )
  }

  static intersects(a: Types.Bounds, b: Types.Bounds) {
    return (
      b.minX <= a.maxX &&
      b.minY <= a.maxY &&
      b.maxX >= a.minX &&
      b.maxY >= a.minY
    )
  }

  static getBoundingBox(boxes: Box[]) {
    let bounds = this.boxToBounds(boxes[0])
    for (let box of boxes) this.extend(bounds, this.boxToBounds(box))
    return bounds
  }
}

export function stretchBoxesX(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let min = first.x
  let max = first.x + first.width
  for (let box of rest) {
    min = Math.min(min, box.x)
    max = Math.max(max, box.x + box.width)
  }
  for (let box of boxes) {
    box.x = min
    box.width = max - min
  }
}
export function stretchBoxesY(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let min = first.y
  let max = first.y + first.height
  for (let box of rest) {
    min = Math.min(min, box.y)
    max = Math.max(max, box.y + box.height)
  }
  for (let box of boxes) {
    box.y = min
    box.height = max - min
  }
}
export function distributeBoxesX(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let min = first.x
  let max = first.x + first.width
  let sum = first.width

  for (let box of rest) {
    min = Math.min(min, box.x)
    max = Math.max(max, box.x + box.width)
    sum += box.width
  }

  let t = min
  const gap = (max - min - sum) / (boxes.length - 1)
  for (let box of [...boxes].sort((a, b) => a.x - b.x)) {
    box.x = t
    t += box.width + gap
  }
}
export function distributeBoxesY(boxes: Types.Box[]) {
  const len = boxes.length
  const sorted = [...boxes].sort((a, b) => a.y - b.y)
  let min = sorted[0].y

  sorted.sort((a, b) => a.y + a.height - b.y - b.height)
  let last = sorted[len - 1]
  let max = last.y + last.height

  let range = max - min
  let step = range / len
  let box: Types.Box
  for (let i = 0; i < len - 1; i++) {
    box = sorted[i]
    box.y = min + step * i
  }
}
export function alignBoxesCenterX(boxes: Types.Box[]) {
  let midX = 0
  for (let box of boxes) {
    midX += box.x + box.width / 2
  }
  midX /= boxes.length
  for (let box of boxes) box.x = midX - box.width / 2
}
export function alignBoxesCenterY(boxes: Types.Box[]) {
  let midY = 0
  for (let box of boxes) midY += box.y + box.height / 2
  midY /= boxes.length
  for (let box of boxes) box.y = midY - box.height / 2
}

export function alignBoxesTop(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let y = first.y
  for (let box of rest) if (box.y < y) y = box.y
  for (let box of boxes) box.y = y
}

export function alignBoxesBottom(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let maxY = first.y + first.height
  for (let box of rest) if (box.y + box.height > maxY) maxY = box.y + box.height
  for (let box of boxes) box.y = maxY - box.height
}

export function alignBoxesLeft(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let x = first.x
  for (let box of rest) if (box.x < x) x = box.x
  for (let box of boxes) box.x = x
}

export function alignBoxesRight(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let maxX = first.x + first.width
  for (let box of rest) if (box.x + box.width > maxX) maxX = box.x + box.width
  for (let box of boxes) box.x = maxX - box.width
}

export function getBoundingBox(boxes: (Types.Box | Box)[]): Types.Bounds {
  if (boxes.length === 0) {
    return {
      id: "temp",
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    }
  }

  const first = boxes[0]

  let x = first.x
  let maxX = first.x + first.width
  let y = first.y
  let maxY = first.y + first.height

  for (let box of boxes) {
    x = Math.min(x, box.x)
    maxX = Math.max(maxX, box.x + box.width)
    y = Math.min(y, box.y)
    maxY = Math.max(maxY, box.y + box.height)
  }

  return {
    id: "temp",
    minX: x,
    minY: x,
    maxX,
    maxY,
  }
}

function getSnapshots(
  boxes: Types.Box[],
  bounds: Types.Bounds
): Record<string, Types.BoxSnapshot> {
  const acc = {} as Record<string, Types.BoxSnapshot>
  const w = bounds.maxX - bounds.minX
  const h = bounds.maxY - bounds.minY
  for (let box of boxes) {
    acc[box.id] = {
      ...box,
      nx: (box.x - bounds.minX) / w,
      ny: (box.y - bounds.minY) / h,
      nmx: 1 - (box.x + box.width - bounds.minX) / w,
      nmy: 1 - (box.y + box.height - bounds.minY) / h,
      nw: box.width / w,
      nh: box.height / h,
    }
  }

  return acc
}

export function getEdgeResizer(
  initialBoxes: Types.Box[],
  initialBounds: Types.Bounds,
  edge: number
) {
  const snapshots = getSnapshots(initialBoxes, initialBounds)

  let { minX: x0, minY: y0, maxX: x1, maxY: y1 } = initialBounds
  let { minX: mx, minY: my } = initialBounds
  let mw = initialBounds.maxX - initialBounds.minX
  let mh = initialBounds.maxY - initialBounds.minY

  return function edgeResize(
    point: Types.Point,
    boxes: Types.Box[],
    bounds: Types.Bounds
  ) {
    const { x, y } = point
    if (edge === 0 || edge === 2) {
      edge === 0 ? (y0 = y) : (y1 = y)
      my = y0 < y1 ? y0 : y1
      mh = Math.abs(y1 - y0)
      for (let box of boxes) {
        const { ny, nmy, nh } = snapshots[box.id]
        box.y = my + (y1 < y0 ? nmy : ny) * mh
        box.height = nh * mh
      }
    } else {
      edge === 1 ? (x1 = x) : (x0 = x)
      mx = x0 < x1 ? x0 : x1
      mw = Math.abs(x1 - x0)
      for (let box of boxes) {
        const { nx, nmx, nw } = snapshots[box.id]
        box.x = mx + (x1 < x0 ? nmx : nx) * mw
        box.width = nw * mw
      }
    }

    bounds.minX = mx
    bounds.minY = my
    bounds.maxX = mx + mw
    bounds.maxY = my + mh
  }
}

/**
 * Returns a function that can be used to calculate corner resize transforms.
 * @param boxes An array of the boxes being resized.
 * @param corner A number representing the corner being dragged. Top Left: 0, Top Right: 1, Bottom Right: 2, Bottom Left: 3.
 * @example
 * const resizer = getCornerResizer(selectedBoxes, 3)
 * resizer(selectedBoxes, )
 */
export function getCornerResizer(
  initialBoxes: Types.Box[],
  initialBounds: Types.Bounds,
  corner: number
) {
  const snapshots = getSnapshots(initialBoxes, initialBounds)

  let { minX: x0, minY: y0, maxX: x1, maxY: y1 } = initialBounds
  let { minX: mx, minY: my } = initialBounds
  let mw = initialBounds.maxX - initialBounds.minX
  let mh = initialBounds.maxY - initialBounds.minY

  return function cornerResizer(
    point: Types.Point,
    boxes: Types.Box[],
    bounds: Types.Bounds
  ) {
    const { x, y } = point
    corner < 2 ? (y0 = y) : (y1 = y)
    my = y0 < y1 ? y0 : y1
    mh = Math.abs(y1 - y0)

    corner === 1 || corner === 2 ? (x1 = x) : (x0 = x)
    mx = x0 < x1 ? x0 : x1
    mw = Math.abs(x1 - x0)

    for (let box of boxes) {
      const { nx, nmx, nw, ny, nmy, nh } = snapshots[box.id]
      box.x = mx + (x1 < x0 ? nmx : nx) * mw
      box.y = my + (y1 < y0 ? nmy : ny) * mh
      box.width = nw * mw
      box.height = nh * mh
    }

    bounds.minX = mx
    bounds.minY = my
    bounds.maxX = mx + mw
    bounds.maxY = my + mh
  }
}

export type EdgeResizer = ReturnType<typeof getEdgeResizer>
export type CornerResizer = ReturnType<typeof getCornerResizer>

export function distributeEvenly<
  T extends { x: number; y: number; height: number; width: number }
>(axis: "x" | "y", boxes: T[]) {
  const mboxes = [...boxes]
  const extent = axis === "x" ? "width" : "height"
  mboxes.sort((a, b) => a[axis] - b[axis])

  // Overall boxes span
  const last = mboxes[mboxes.length - 1]
  const dist = last[axis] + last[extent] - mboxes[0][axis]

  // Space used by boxes
  let span = 0
  for (let box of mboxes) {
    span += box[extent]
  }

  // New distance between boxes
  let step = Math.floor((dist - span) / (mboxes.length - 1))
  let pos = mboxes[0][axis]

  console.log(dist, span + step * (mboxes.length - 1))

  for (let box of mboxes) {
    console.log(Math.abs(pos - box[axis]))
    if (Math.abs(pos - box[axis]) >= 1) {
      box[axis] += pos - box[axis]
    }
    pos += box[extent]
    pos += step
  }

  return mboxes
}
