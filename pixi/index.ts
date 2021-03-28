import { S } from "@state-designer/react"
import * as Pixi from "pixi.js"
import boxApi from "./boxes/box-api"
import * as Types from "./types"
import * as Utils from "./utils"
import Box from "./shapes/box"
import Bounds from "./shapes/brush"
import uniqueId from "lodash/uniqueId"
import uiState, { data, brush, surface } from "./ui-state"

let app: Pixi.Application
export let ORIGIN_X: number
export let ORIGIN_Y: number
export let MIN_DISTANCE: number

export const background = new Pixi.Graphics()
export const overlay = new Pixi.Graphics()

surface.sortableChildren = true
brush.hide()

// Shapes

export function getRect(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number
) {
  const rect = new Box(x, y, z, width, height)
  surface.addChild(rect.graphics)
  return rect
}

function spawnBoxes(count: number) {
  let boxes: Types.Box[] = []

  const size = Math.min(200, Math.max(8, window.innerWidth / Math.sqrt(count)))
  const hsize = size / 2

  for (let i = 0; i < count; i++) {
    boxes.push({
      id: uniqueId(),
      x: 32 + Math.random() * (app.screen.width - 64 - size),
      y: 32 + Math.random() * (app.screen.height - 64 - size),
      z: i,
      width: hsize + Math.random() * hsize,
      height: hsize + Math.random() * hsize,
    })
  }

  boxes
    .sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))
    .forEach((box, i) => (box.z = i))

  return boxApi.setBoxes(boxes)
}

export function setup(
  element: HTMLCanvasElement,
  container: HTMLDivElement,
  count = 1000
) {
  // const cvs = document.createElement("canvas")
  // element.children[0] && element.removeChild(element.children[0])
  // element.appendChild(cvs)

  app = new Pixi.Application({
    resolution: window.devicePixelRatio,
    autoDensity: true,
    view: element,
    preserveDrawingBuffer: false,
  })

  app.renderer.backgroundColor = 0x333333
  app.resizeTo = container
  app.resize()

  const interactions: Pixi.InteractionManager = app.renderer.plugins.interaction

  // Data

  ORIGIN_X = element.offsetLeft
  ORIGIN_Y = element.offsetTop
  MIN_DISTANCE = Math.min(1 - count / 100000, 1) * 100

  // Starting off Pixi

  app.loader.load(async () => {
    app.stage.addChild(background)
    app.stage.addChild(surface)
    app.stage.addChild(overlay)
    app.stage.addChild(brush.graphics)

    background.beginFill(0xefefef)
    background.drawRect(0, 0, app.view.width, app.view.height)
    background.endFill()

    await spawnBoxes(count)
  })

  async function handlePointerDown(e: PointerEvent) {
    let { clientX: x, clientY: y } = e

    x -= ORIGIN_X
    y -= ORIGIN_Y

    uiState.send("DOWNED_POINTER", { point: { x, y } })

    if (data.selected.length > 0) {
      let brushHit = brush.hitTest({ x, y })

      if (brushHit !== undefined) {
        switch (brushHit.type) {
          case "body": {
            uiState.send("POINTED_BRUSH")
            return
          }
          case "edge": {
            uiState.send("POINTED_BRUSH_EDGE", { edge: brushHit.edge })
            return
          }
          case "corner": {
            uiState.send("POINTED_BRUSH_CORNER", { corner: brushHit.corner })
            return
          }
        }
      }
    }

    // No selected, or no hit outside of the brush?

    // Find the clicked boxes
    let hits = await boxApi.hitTest({ x, y })

    if (hits.length > 0) {
      // Send in the top box / highest z index
      hits = hits.sort((a, b) => b.z - a.z)
      uiState.send("POINTED_BOX", { boxes: [hits[0]], shift: e.shiftKey })
      return
    }

    // No hits, must have hit the canvas
    uiState.send("POINTED_CANVAS", { point: { x, y }, shift: e.shiftKey })
  }

  async function handlePointerUp() {
    uiState.send("RAISED_POINTER")
  }

  async function handlePointerMove(e: PointerEvent) {
    let { clientX: x, clientY: y } = e

    x -= ORIGIN_X
    y -= ORIGIN_Y

    uiState.send("MOVED_POINTER", { point: { x, y }, shift: e.shiftKey })
  }

  async function handleElementPointerMove(e: PointerEvent) {
    uiState.send("MOVED_POINTER_OVER_CANVAS")
  }

  async function handleKeyPress(e: KeyboardEvent) {
    switch (e.key) {
      case "q": {
        uiState.send("ALIGNED_LEFT")
        break
      }
      case "w": {
        uiState.send("ALIGNED_CENTER_X")
        break
      }
      case "e": {
        uiState.send("ALIGNED_RIGHT")
        break
      }
      case "a": {
        uiState.send("ALIGNED_TOP")
        break
      }
      case "s": {
        uiState.send("ALIGNED_CENTER_Y")
        break
      }
      case "d": {
        uiState.send("ALIGNED_BOTTOM")
        break
      }
      case "r": {
        uiState.send("STRETCHED_X")
        break
      }
      case "f": {
        uiState.send("STRETCHED_Y")
        break
      }
      case "]": {
        uiState.send("MOVED_BOXES_FORWARD")
        break
      }
      case "[": {
        uiState.send("MOVED_BOXES_BACKWARD")
        break
      }
      case "Backspace": {
        uiState.send("DELETED")
        break
      }
    }
  }

  surface.sortChildren()

  interactions.destroy()
  element.addEventListener("pointerdown", handlePointerDown)
  element.addEventListener("pointermove", handleElementPointerMove)
  window.addEventListener("pointerup", handlePointerUp)
  window.addEventListener("pointermove", handlePointerMove)
  window.addEventListener("keydown", handleKeyPress)

  function onDestroy() {
    app.destroy()
    element.removeEventListener("pointerdown", handlePointerDown)
    element.removeEventListener("pointermove", handleElementPointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("keydown", handleKeyPress)
  }

  return [app, onDestroy] as const
}
