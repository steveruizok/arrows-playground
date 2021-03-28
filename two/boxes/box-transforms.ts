import * as Types from "../types"

export function stretchBoxesX(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let min = first.x
  let max = first.x + first.width
  for (let box of rest) {
    min = Math.min(min, box.x)
    max = Math.max(max, box.x + box.width)
  }
  return boxes.map((box) => ({ ...box, x: min, width: max - min }))
}
export function stretchBoxesY(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let min = first.y
  let max = first.y + first.height
  for (let box of rest) {
    min = Math.min(min, box.y)
    max = Math.max(max, box.y + box.height)
  }
  return boxes.map((box) => ({ ...box, y: min, height: max - min }))
}
export function distributeBoxesX(boxes: Types.Box[]) {
  const len = boxes.length
  const sorted = [...boxes].sort((a, b) => a.x - b.x)
  let min = sorted[0].x

  sorted.sort((a, b) => a.x + a.width - b.x - b.width)
  let last = sorted[len - 1]
  let max = last.x + last.width

  let range = max - min
  let step = range / len
  return sorted.map((box, i) => ({ ...box, x: min + step * i }))
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
  return sorted.map((box, i) => ({ ...box, y: min + step * i }))
}
export function alignBoxesCenterX(boxes: Types.Box[]) {
  let midX = 0
  for (let box of boxes) midX += box.x + box.width / 2
  midX /= boxes.length
  return boxes.map((box) => ({ ...box, x: midX - box.width / 2 }))
}
export function alignBoxesCenterY(boxes: Types.Box[]) {
  let midY = 0
  for (let box of boxes) midY += box.y + box.height / 2
  midY /= boxes.length
  return boxes.map((box) => ({ ...box, y: midY - box.height / 2 }))
}

export function alignBoxesTop(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let y = first.y
  for (let box of rest) if (box.y < y) y = box.y
  return boxes.map((box) => ({ ...box, y }))
}

export function alignBoxesBottom(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let maxY = first.y + first.height
  for (let box of rest) if (box.y + box.height > maxY) maxY = box.y + box.height
  return boxes.map((box) => ({ ...box, y: maxY - box.height }))
}

export function alignBoxesLeft(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let x = first.x
  for (let box of rest) if (box.x < x) x = box.x
  return boxes.map((box) => ({ ...box, x }))
}

export function alignBoxesRight(boxes: Types.Box[]) {
  const [first, ...rest] = boxes
  let maxX = first.x + first.width
  for (let box of rest) if (box.x + box.width > maxX) maxX = box.x + box.width
  return boxes.map((box) => ({ ...box, x: maxX - box.width }))
}

// Resizers

export function getBoundingBox(boxes: Types.Box[]): Types.Bounds {
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

  let minX = first.x
  let minY = first.y
  let maxX = first.x + first.width
  let maxY = first.y + first.height

  for (let box of boxes) {
    minX = Math.min(minX, box.x)
    minY = Math.min(minY, box.y)
    maxX = Math.max(maxX, box.x + box.width)
    maxY = Math.max(maxY, box.y + box.height)
  }

  return {
    id: "temp",
    minX,
    minY,
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

export function getEdgeResizer(boxes: Types.Box[], edge: number) {
  const initial = getBoundingBox(boxes)
  const snapshots = getSnapshots(boxes, initial)
  const mboxes = [...boxes]

  let { minX: x0, minY: y0, maxX: x1, maxY: y1 } = initial
  let { minX: mx, minY: my } = initial
  let mw = x1 - x0
  let mh = y1 - y0

  return function edgeResize({ x, y }) {
    if (edge === 0 || edge === 2) {
      edge === 0 ? (y0 = y) : (y1 = y)
      my = y0 < y1 ? y0 : y1
      mh = Math.abs(y1 - y0)
      for (let box of mboxes) {
        const { ny, nmy, nh } = snapshots[box.id]
        box.y = my + (y1 < y0 ? nmy : ny) * mh
        box.height = nh * mh
      }
    } else {
      edge === 1 ? (x1 = x) : (x0 = x)
      mx = x0 < x1 ? x0 : x1
      mw = Math.abs(x1 - x0)
      for (let box of mboxes) {
        const { nx, nmx, nw } = snapshots[box.id]
        box.x = mx + (x1 < x0 ? nmx : nx) * mw
        box.width = nw * mw
      }
    }

    return [
      mboxes,
      {
        x: mx,
        y: my,
        width: mw,
        height: mh,
        maxX: mx + mw,
        maxY: my + mh,
      },
    ]
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
export function getCornerResizer(boxes: Types.Box[], corner: number) {
  const initial = getBoundingBox(boxes)
  const snapshots = getSnapshots(boxes, initial)
  const mboxes = [...boxes]

  let { minX: x0, minY: y0, maxX: x1, maxY: y1 } = initial
  let { minX: mx, minY: my } = initial
  let mw = x1 - x0
  let mh = y1 - y0

  return function cornerResizer({ x, y }) {
    corner < 2 ? (y0 = y) : (y1 = y)
    my = y0 < y1 ? y0 : y1
    mh = Math.abs(y1 - y0)

    corner === 1 || corner === 2 ? (x1 = x) : (x0 = x)
    mx = x0 < x1 ? x0 : x1
    mw = Math.abs(x1 - x0)

    for (let box of mboxes) {
      const { nx, nmx, nw, ny, nmy, nh } = snapshots[box.id]
      box.x = mx + (x1 < x0 ? nmx : nx) * mw
      box.y = my + (y1 < y0 ? nmy : ny) * mh
      box.width = nw * mw
      box.height = nh * mh
    }

    return [
      mboxes,
      {
        x: mx,
        y: my,
        width: mw,
        height: mh,
        maxX: mx + mw,
        maxY: my + mh,
      },
    ]
  }
}
