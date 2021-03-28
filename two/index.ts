import Two from "two.js"
import Box from "./shapes/box"
import boxApi from "./boxes/box-api"
import * as Types from "./types"
import * as Utils from "./utils"

let two: Two
export let ORIGIN_X: number
export let ORIGIN_Y: number
export let MIN_DISTANCE: number

let background: Two.Rectangle
let brush: Two.Rectangle
let surface: Two.Group

// Shapes

export function getRect(x: number, y: number, width: number, height: number) {
  const rect = new Box(
    ORIGIN_X + x + width / 2,
    ORIGIN_Y + y + height / 2,
    width,
    height
  )

  surface.add(rect.graphics)
  return rect
}

function spawnBoxes(count: number) {
  let boxes: Types.Box[] = []

  for (let i = 0; i < count; i++) {
    boxes.push({
      id: i,
      x: 32 + Math.random() * (two.width - 64),
      y: 32 + Math.random() * (two.height - 64),
      width: 4 + Math.random() * 8,
      height: 4 + Math.random() * 8,
    })
  }

  return boxApi.setBoxes(boxes)
}

export async function setup(element: HTMLElement, count = 1000) {
  two = new Two({
    width: element.offsetWidth,
    height: element.offsetHeight,
  })

  element.children[0] && element.removeChild(element.children[0])
  two.appendTo(element)

  ORIGIN_X = -two.width / 2
  ORIGIN_Y = -two.height / 2
  MIN_DISTANCE = Math.min(1 - count / 100000, 1) * 100

  let pointerStart: Types.Point = {
    x: 0,
    y: 0,
  }

  let pointer: Types.Point = {
    x: 0,
    y: 0,
  }

  let delta: Types.Point = {
    x: 0,
    y: 0,
  }

  let state: string = "idle"
  let selected: Box[] = []
  let pending = 0

  background = two.makeRectangle(0, 0, two.width, two.height)
  background.fill = "#efefef"

  surface = two.makeGroup(background)
  surface.translation.set(two.width / 2, two.height / 2)

  brush = two.makeRectangle(0, 0, 0, 0)
  brush.fill = "rgba(0,0,255,.15)"
  brush.stroke = "#0000ff"

  await spawnBoxes(count)

  function updateBrush() {
    const minX = Math.min(pointer.x, pointerStart.x),
      minY = Math.min(pointer.y, pointerStart.y),
      maxX = Math.max(pointer.x, pointerStart.x),
      maxY = Math.max(pointer.y, pointerStart.y)

    brush.vertices[0].set(minX, minY)
    brush.vertices[1].set(maxX, minY)
    brush.vertices[2].set(maxX, maxY)
    brush.vertices[3].set(minX, maxY)
  }

  async function setBrushSelected() {
    const x = Math.min(pointer.x, pointerStart.x),
      y = Math.min(pointer.y, pointerStart.y),
      width = Math.abs(pointer.x - pointerStart.x),
      height = Math.abs(pointer.y - pointerStart.y)

    return boxApi.hitTest({ x: x + ORIGIN_X, y: y + ORIGIN_Y, width, height })
  }

  function endSelection() {
    sizeBrushToSelected()
  }

  function sizeBrushToSelected() {
    if (selected.length > 0) {
      const bounds = Utils.Bounds.getBoundingBox(selected)
      const { minX, maxX, minY, maxY } = bounds
      brush.translation.set(-ORIGIN_X, -ORIGIN_Y)
      brush.vertices[0].set(minX, minY)
      brush.vertices[1].set(maxX, minY)
      brush.vertices[2].set(maxX, maxY)
      brush.vertices[3].set(minX, maxY)
    } else {
      clearBrush()
    }
  }

  function showSelectedBoxes() {
    for (let rect of selected) {
      rect.stroke = "#000099"
    }
  }

  async function moveSelected() {
    // overlay.setTransform(overlay.x + delta.x, overlay.y + delta.y)
    for (let box of selected) {
      box.moveBy(delta.x, delta.y)
    }
    brush.translation.set(
      brush.translation.x + delta.x,
      brush.translation.y + delta.y
    )
  }

  // async function clearSelected() {
  //   // overlay.clear()

  //   endSelection()

  //   selected = []
  // }

  async function setSelected() {
    const x = Math.min(pointer.x, pointerStart.x),
      y = Math.min(pointer.y, pointerStart.y),
      maxX = Math.max(pointer.x, pointerStart.x),
      maxY = Math.max(pointer.y, pointerStart.y),
      width = Math.abs(pointer.x - pointerStart.x),
      height = Math.abs(pointer.y - pointerStart.y)

    brush.vertices[0].set(x, y)
    brush.vertices[1].set(maxX, y)
    brush.vertices[2].set(maxX, maxY)
    brush.vertices[3].set(x, maxY)

    boxApi
      .hitTest({ x: x + ORIGIN_X, y: y + ORIGIN_Y, width, height })
      .then((results) => {
        if (state !== "selecting") return

        for (let rect of selected) {
          rect.stroke = "#000000"
          rect.fill = "rgba(0, 255, 51, .05)"
        }

        selected = results

        for (let rect of selected) {
          rect.stroke = "#0000FF"
          rect.fill = "rgba(0, 255, 51, .05)"
        }
      })
      .catch((e) => {})
  }

  function clearBrush() {
    brush.vertices[0].set(0, 0)
    brush.vertices[1].set(0, 0)
    brush.vertices[2].set(0, 0)
    brush.vertices[3].set(0, 0)
  }

  // Events

  async function handlePointerDown(e: PointerEvent) {
    const { clientX: x, clientY: y } = e

    if (state === "idle" && selected.length > 0) {
      const rect = brush.getBoundingClientRect()
      const minX = rect.left,
        minY = rect.top,
        maxX = rect.right,
        maxY = rect.bottom

      if (!(x < minX || x > maxX || y < minY || y > maxY)) {
        state = "dragging"
        return
      }
    }

    pointerStart.x = x
    pointerStart.y = y
    brush.translation.set(0, 0)

    for (let rect of selected) {
      rect.stroke = "#000000"
    }

    selected = []
    endSelection()
    state = "selecting"
  }

  async function handlePointerUp() {
    if (state === "dragging") {
      state = "idle"
      await boxApi.updateBoxes(selected)
    } else if (state === "selecting") {
      state = "idle"
      setBrushSelected()
        .then((results = []) => {
          for (let rect of selected) {
            rect.stroke = "#000000"
          }

          selected = results

          sizeBrushToSelected()
          showSelectedBoxes()
        })
        .catch((e) => {})
    }
  }

  async function handlePointerMove(e: PointerEvent) {
    const { clientX: x, clientY: y } = e
    delta.x = x - pointer.x
    delta.y = y - pointer.y
    pointer.x = x
    pointer.y = y

    if (state === "selecting" && e.buttons === 1) {
      updateBrush()

      if (Math.hypot(delta.x, delta.y) > MIN_DISTANCE) return

      setBrushSelected().then((results) => {
        if (selected.length === results.length) return

        for (let rect of selected) {
          rect.stroke = "#000000"
        }

        selected = results

        if (state === "idle") {
          sizeBrushToSelected()
        }
        showSelectedBoxes()
      })
    } else if (state === "dragging") {
      moveSelected()
    }
  }

  async function handleKeyPress(e: KeyboardEvent) {
    switch (e.key) {
      case "q": {
        if (selected.length > 0) {
          await boxApi.alignBoxes("left", selected)
          showSelectedBoxes()
          sizeBrushToSelected()
        }
        break
      }
      case "w": {
        if (selected.length > 0) {
          await boxApi.alignBoxes("centerX", selected)
          showSelectedBoxes()
          sizeBrushToSelected()
        }
        break
      }
      case "e": {
        if (selected.length > 0) {
          await boxApi.alignBoxes("right", selected)
          showSelectedBoxes()
          sizeBrushToSelected()
        }
        break
      }
      case "a": {
        if (selected.length > 0) {
          await boxApi.alignBoxes("top", selected)
          showSelectedBoxes()
          sizeBrushToSelected()
        }
        break
      }
      case "s": {
        if (selected.length > 0) {
          await boxApi.alignBoxes("centerY", selected)
          showSelectedBoxes()
          sizeBrushToSelected()
        }
        break
      }
      case "d": {
        if (selected.length > 0) {
          await boxApi.alignBoxes("bottom", selected)
          showSelectedBoxes()
          sizeBrushToSelected()
        }
        break
      }
      case "r": {
        if (selected.length > 0) {
          await boxApi.stretchBoxes("x", selected)
          showSelectedBoxes()
          sizeBrushToSelected()
        }
        break
      }
      case "f": {
        if (selected.length > 0) {
          await boxApi.stretchBoxes("y", selected)
          showSelectedBoxes()
          sizeBrushToSelected()
        }
        break
      }
    }
  }

  document.body.addEventListener("pointerdown", handlePointerDown)
  document.body.addEventListener("pointerup", handlePointerUp)
  document.body.addEventListener("pointermove", handlePointerMove)

  window.addEventListener("keydown", handleKeyPress)

  two.update()

  // const first = boxApi.boxes()[0].id

  function loop() {
    // boxApi.moveBoxBy(first, 1, 1)
    // setSelected()
  }

  two.bind("update", loop).play() // Finally, start the animation loop

  return two
}
