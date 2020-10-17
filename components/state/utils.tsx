import { getBoxToBoxArrow, ArrowOptions } from "perfect-arrows"
import { browser } from "process"
import uniqueId from "lodash/clamp"
import clamp from "lodash/clamp"
import { IPoint, IBounds, IFrame, IBox, IArrow } from "../../types"
import state from "./index"

const RESET_LOCAL_DATA = true

export let scale = 1
export const pressedKeys = {} as Record<string, boolean>
export const pointer = { x: 0, y: 0 }
export const origin = { x: 0, y: 0 }
export const cameraOrigin = { x: 0, y: 0 }
export const camera = { x: 0, y: 0, cx: 0, cy: 0, width: 0, height: 0 }

export function viewBoxToCamera(
  point: IPoint,
  viewBox: IFrame,
  camera: { x: number; y: number; zoom: number }
) {
  return {
    x: (camera.x + point.x - viewBox.x) / camera.zoom,
    y: (camera.y + point.y - viewBox.y) / camera.zoom,
  }
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
    width: maxX - x,
    height: maxY - y,
    maxX,
    maxY,
  }
}

export function mapValues<P, T>(
  obj: { [key: string]: T },
  fn: (value: T, index: number) => P
): { [key: string]: P } {
  return Object.fromEntries(
    Object.entries(obj).map(([id, value], index) => [id, fn(value, index)])
  )
}

export function getInitialIndex() {
  if (browser) {
    return "0"
  }

  let curIndex = "1"
  let prevIndex: any = localStorage.getItem("__index")
  if (prevIndex === null) {
    curIndex = "1"
  } else {
    const num = parseInt(JSON.parse(prevIndex), 10)
    curIndex = (num + 1).toString()
  }

  localStorage.setItem("__index", JSON.stringify(curIndex))
}

/**
 * Get the initial data for the store.
 */
export function getInitialData(): {
  boxes: Record<string, IBox>
  arrows: Record<string, IArrow>
  selectedBoxIds: string[]
  selectedArrowIds: string[]
} {
  let previous = null
  let initial: {
    boxes: Record<string, IBox>
    arrows: Record<string, IArrow>
    selectedBoxIds: string[]
    selectedArrowIds: string[]
  }

  if (browser) {
    previous = localStorage.getItem("__2_current")
  }

  if (previous === null || RESET_LOCAL_DATA) {
    // Initial Boxes
    const initBoxes = {
      box_a0: {
        id: "box_a0",
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        label: "",
        color: "rgba(255, 255, 255, 1)",
      },
      box_a1: {
        id: "box_a1",
        x: 200,
        y: 300,
        width: 100,
        height: 100,
        label: "",
        color: "rgba(255, 255, 255, 1)",
      },
    }

    // Initial Arrows
    const a = initBoxes["box_a0"]
    const b = initBoxes["box_a1"]
    const initArrows = {
      arrow_a0: {
        id: "arrow_a0",
        from: "init0",
        to: "init1",
        flip: false,
        label: "",
        points: getArrow(a, b),
      },
    }

    initial = {
      boxes: initBoxes,
      arrows: initArrows,
      selectedArrowIds: [],
      selectedBoxIds: [],
    }
  } else {
    initial = JSON.parse(previous)
  }

  return initial
}

/**
 * Get an arrow between boxes.
 * @param a
 * @param b
 * @param options
 */
export function getArrow(
  a: IBox,
  b: IBox,
  options: Partial<ArrowOptions> = {}
) {
  const opts = {
    box: 0.05,
    stretchMax: 1200,
    padEnd: 12,
    ...options,
  }
  return getBoxToBoxArrow(
    a.x,
    a.y,
    a.width,
    a.height,
    b.x,
    b.y,
    b.width,
    b.height,
    opts
  )
}

const keyDownActions = {
  Escape: "CANCELLED",
  Alt: "ENTERED_ALT_MODE",
  " ": "ENTERED_SPACE_MODE",
  Shift: "ENTERED_SHIFT_MODE",
  Control: "ENTERED_CONTROL_MODE",
  Meta: "ENTERED_META_MODE",
}

const keyUpActions = {
  Alt: "EXITED_ALT_MODE",
  " ": "EXITED_SPACE_MODE",
  Shift: "EXITED_SHIFT_MODE",
  Control: "EXITED_CONTROL_MODE",
  Meta: "EXITED_META_MODE",
  f: "SELECTED_DRAWING",
  v: "SELECTED_SELECTING",
}

export function handleKeyDown(e: KeyboardEvent) {
  pressedKeys[e.key] = true
  const action = keyDownActions[e.key]
  if (action) {
    state.send(action)
  }
  // Handle shift here?
}

export function handleKeyUp(e: KeyboardEvent) {
  pressedKeys[e.key] = false
  const action = keyUpActions[e.key]
  if (action) {
    state.send(action)
  }
}

export function handleKeyPress(e: KeyboardEvent) {
  if (e.key === " " && !state.isInAny("editingLabel", "editingArrowLabel")) {
    e.preventDefault()
  }
}

export function doBoxesCollide(a: IFrame, b: IFrame) {
  return !(
    a.x > b.x + b.width ||
    a.y > b.y + b.height ||
    a.x + a.width < b.x ||
    a.y + a.height < b.y
  )
}

export function getBox(
  x: number,
  y: number,
  width: number,
  height: number
): IBox {
  return {
    id: uniqueId(),
    x,
    y,
    width,
    height,
    label: "",
    color: "#ffffff",
  }
}
