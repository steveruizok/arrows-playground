import { IBoxSnapshot, IPointer, IBounds, IBox } from "../../types"

export function stretchBoxesX(boxes: IBox[]) {
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
export function stretchBoxesY(boxes: IBox[]) {
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
export function distributeBoxesX(boxes: IBox[]) {
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
export function distributeBoxesY(boxes: IBox[]) {
  const [first, ...rest] = boxes
  let min = first.y
  let max = first.y + first.height
  let sum = first.height

  for (let box of rest) {
    min = Math.min(min, box.y)
    max = Math.max(max, box.y + box.height)
    sum += box.height
  }

  let t = min
  const gap = (max - min - sum) / (boxes.length - 1)
  for (let box of [...boxes].sort((a, b) => a.y - b.y)) {
    box.y = t
    t += box.height + gap
  }
}
export function alignBoxesCenterX(boxes: IBox[]) {
  let midX = 0
  for (let box of boxes) {
    midX += box.x + box.width / 2
  }
  midX /= boxes.length
  for (let box of boxes) box.x = midX - box.width / 2
}
export function alignBoxesCenterY(boxes: IBox[]) {
  let midY = 0
  for (let box of boxes) midY += box.y + box.height / 2
  midY /= boxes.length
  for (let box of boxes) box.y = midY - box.height / 2
}

export function alignBoxesTop(boxes: IBox[]) {
  const [first, ...rest] = boxes
  let y = first.y
  for (let box of rest) if (box.y < y) y = box.y
  for (let box of boxes) box.y = y
}

export function alignBoxesBottom(boxes: IBox[]) {
  const [first, ...rest] = boxes
  let maxY = first.y + first.height
  for (let box of rest) if (box.y + box.height > maxY) maxY = box.y + box.height
  for (let box of boxes) box.y = maxY - box.height
}

export function alignBoxesLeft(boxes: IBox[]) {
  const [first, ...rest] = boxes
  let x = first.x
  for (let box of rest) if (box.x < x) x = box.x
  for (let box of boxes) box.x = x
}

export function alignBoxesRight(boxes: IBox[]) {
  const [first, ...rest] = boxes
  let maxX = first.x + first.width
  for (let box of rest) if (box.x + box.width > maxX) maxX = box.x + box.width
  for (let box of boxes) box.x = maxX - box.width
}

export function getBoundingBox(boxes: IBox[]): IBounds {
  if (boxes.length === 0) {
    return {
      x: 0,
      y: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
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
    x,
    y,
    maxX,
    maxY,
    width: maxX - x,
    height: maxY - y,
  }
}

export function getEdgeResizer(boxes: IBox[], edge: number) {
  const bounds = getBoundingBox(boxes)

  const snapshots: Record<string, IBoxSnapshot> = Object.fromEntries(
    boxes.map((box) => [
      box.id,
      {
        ...box,
        nx: (box.x - bounds.x) / bounds.width,
        ny: (box.y - bounds.y) / bounds.height,
        nmx: (box.x + box.width - bounds.x) / bounds.width,
        nmy: (box.y + box.height - bounds.y) / bounds.height,
        nw: box.width / bounds.width,
        nh: box.height / bounds.height,
      },
    ])
  )

  return function edgeResize(boxes: IBox[], current: IBounds, point: IPointer) {
    const { x, y } = point
    let snap: IBoxSnapshot

    switch (edge) {
      case 0: {
        const height = Math.abs(bounds.maxY - y)
        const belowMax = y > bounds.maxY
        for (let box of boxes) {
          snap = snapshots[box.id]
          box.height = snap.nh * height
          box.y = belowMax // Min Y (top)
            ? bounds.maxY + (1 - snap.nmy) * height
            : y + snap.ny * height
        }

        if (belowMax) {
          current.y = bounds.maxY
          current.height = point.y - bounds.maxY
        } else {
          current.y = point.y
          current.height = bounds.maxY - point.y
        }

        break
      }
      case 1: {
        const width = Math.abs(x - bounds.x)
        const leftOfMin = x < bounds.x
        for (let box of boxes) {
          snap = snapshots[box.id]
          box.width = snap.nw * width
          box.x = leftOfMin // Max X (right)
            ? x + (1 - snap.nmx) * width
            : bounds.x + snap.nx * width
        }

        if (leftOfMin) {
          current.x = point.x
          current.width = bounds.x - point.x
        } else {
          current.x = bounds.x
          current.width = point.x - bounds.x
        }
        break
      }
      case 2: {
        const height = Math.abs(y - bounds.y)
        const aboveMin = y < bounds.y
        for (let box of boxes) {
          snap = snapshots[box.id]
          box.height = snap.nh * height
          box.y = aboveMin // MaxY Y (bottom)
            ? y + (1 - snap.nmy) * height
            : bounds.y + snap.ny * height
        }

        if (aboveMin) {
          current.y = point.y
          current.height = bounds.y - point.y
        } else {
          current.y = bounds.y
          current.height = point.y - bounds.y
        }

        break
      }
      case 3: {
        const width = Math.abs(bounds.maxX - x)
        const rightOfMax = x > bounds.maxX
        for (let box of boxes) {
          snap = snapshots[box.id]
          box.width = snap.nw * width
          box.x = rightOfMax // Min X (left)
            ? bounds.maxX + (1 - snap.nmx) * width
            : x + snap.nx * width
        }

        if (rightOfMax) {
          current.x = bounds.maxX
          current.width = point.x - bounds.maxX
        } else {
          current.x = point.x
          current.width = bounds.maxX - point.x
        }

        break
      }
    }
  }
}

export function getCornerResizer(boxes: IBox[], corner: number) {
  const bounds = getBoundingBox(boxes)

  const snapshots: Record<string, IBoxSnapshot> = Object.fromEntries(
    boxes.map((box) => [
      box.id,
      {
        ...box,
        nx: (box.x - bounds.x) / bounds.width,
        ny: (box.y - bounds.y) / bounds.height,
        nmx: (box.x + box.width - bounds.x) / bounds.width,
        nmy: (box.y + box.height - bounds.y) / bounds.height,
        nw: box.width / bounds.width,
        nh: box.height / bounds.height,
      },
    ])
  )

  return function cornerResize(
    boxes: IBox[],
    current: IBounds,
    point: IPointer
  ) {
    const { x, y } = point
    let snap: IBoxSnapshot

    const leftOfMin = x < bounds.x
    const rightOfMax = x > bounds.maxX
    const aboveMin = y < bounds.y
    const belowMax = y > bounds.maxY

    switch (corner) {
      case 0: {
        // Top Left
        const width = Math.abs(bounds.maxX - x)
        const height = Math.abs(bounds.maxY - y)
        for (let box of boxes) {
          snap = snapshots[box.id]
          box.width = snap.nw * width
          box.x = rightOfMax // Min X (Left)
            ? bounds.maxX + (1 - snap.nmx) * width
            : x + snap.nx * width
          box.height = snap.nh * height
          box.y = belowMax // Min Y (Top)
            ? bounds.maxY + (1 - snap.nmy) * height
            : y + snap.ny * height
        }

        if (rightOfMax) {
          current.x = bounds.maxX
          current.width = point.x - bounds.maxX
        } else {
          current.x = point.x
          current.width = bounds.maxX - point.x
        }

        if (belowMax) {
          current.y = bounds.maxY
          current.height = point.y - bounds.maxY
        } else {
          current.y = point.y
          current.height = bounds.maxY - point.y
        }

        break
      }
      case 1: {
        const width = Math.abs(x - bounds.x)
        const height = Math.abs(bounds.maxY - y)
        for (let box of boxes) {
          snap = snapshots[box.id]
          box.width = snap.nw * width
          box.x = leftOfMin // Max X (Right)
            ? x + (1 - snap.nmx) * width
            : bounds.x + snap.nx * width
          box.height = snap.nh * height
          box.y = belowMax // Min Y (Top)
            ? bounds.maxY + (1 - snap.nmy) * height
            : y + snap.ny * height
        }

        if (leftOfMin) {
          current.x = point.x
          current.width = bounds.x - point.x
        } else {
          current.x = bounds.x
          current.width = point.x - bounds.x
        }

        if (belowMax) {
          current.y = bounds.maxY
          current.height = point.y - bounds.maxY
        } else {
          current.y = point.y
          current.height = bounds.maxY - point.y
        }

        break
      }
      case 2: {
        const width = Math.abs(x - bounds.x)
        const height = Math.abs(y - bounds.y)
        for (let box of boxes) {
          snap = snapshots[box.id]
          box.width = snap.nw * width
          box.x = leftOfMin // Max X (Right)
            ? x + (1 - snap.nmx) * width
            : bounds.x + snap.nx * width
          box.height = snap.nh * height
          box.y = aboveMin // Max Y (Bottom)
            ? y + (1 - snap.nmy) * height
            : bounds.y + snap.ny * height
        }

        if (leftOfMin) {
          current.x = point.x
          current.width = bounds.x - point.x
        } else {
          current.x = bounds.x
          current.width = point.x - bounds.x
        }

        if (aboveMin) {
          current.y = point.y
          current.height = bounds.y - point.y
        } else {
          current.y = bounds.y
          current.height = point.y - bounds.y
        }
        break
      }
      case 3: {
        const width = Math.abs(bounds.maxX - x)
        const height = Math.abs(y - bounds.y)
        for (let box of boxes) {
          snap = snapshots[box.id]
          box.width = snap.nw * width
          box.x = rightOfMax // Min X (Left)
            ? bounds.maxX + (1 - snap.nmx) * width
            : x + snap.nx * width
          box.height = snap.nh * height
          box.y = aboveMin // Max Y (Bottom)
            ? y + (1 - snap.nmy) * height
            : bounds.y + snap.ny * height
        }

        if (rightOfMax) {
          current.x = bounds.maxX
          current.width = point.x - bounds.maxX
        } else {
          current.x = point.x
          current.width = bounds.maxX - point.x
        }

        if (aboveMin) {
          current.y = point.y
          current.height = bounds.y - point.y
        } else {
          current.y = bounds.y
          current.height = point.y - bounds.y
        }
        break
      }
    }
  }
}

export type EdgeResizer = ReturnType<typeof getEdgeResizer>
export type CornerResizer = ReturnType<typeof getCornerResizer>
