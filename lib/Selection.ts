import Point from "./Point"
import * as Pixi from "pixi.js"
import pointer from "./pointer"
import SimpleBox from "./SimpleBox"
import App from "./index"

type Status = "idle" | "pointing" | "dragging" | "hovered"

class Selection extends Pixi.Container {
  app: App
  point?: Point
  status: Status = "idle"
  overlay = new Pixi.Graphics()
  bounds = new Pixi.Bounds()
  boxes = [] as SimpleBox[]

  constructor(app: App) {
    super()
    this.app = app
    this.addChild(this.overlay)
    // this.draw(x, y, width, height)

    this.interactive = true
    this.buttonMode = true
    this.addListener("pointerdown", this.handlePointerDown)
    this.addListener("pointerup", this.handlePointerUp)
    this.addListener("pointerupoutside", this.handlePointerUp)
    this.addListener("pointerover", this.handlePointerOver)
    this.addListener("pointerout", this.handlePointerOut)
    this.addListener("pointermove", this.handlePointerMove)
  }

  setSelectedBoxes = (boxes: SimpleBox[]) => {
    this.boxes = boxes
    this.draw()
  }

  drawBounds = () => {
    this.overlay.clear()
    const bounds = getBoundingBox(this.boxes)

    this.overlay.beginFill(0x3333ff, 0.01)
    this.overlay.lineStyle(1, 0x3333ff, 1)
    this.overlay.drawRect(bounds.x, bounds.y, bounds.width, bounds.height)

    for (let box of this.boxes) {
      const { minX, minY, maxX, maxY } = box
      this.overlay.drawRect(minX, minY, maxX - minX, maxY - minY)
    }
    this.overlay.endFill()
  }

  draw = () => {
    // this.overlay.clear()

    if (this.boxes.length === 0) {
      this.setTransform(0, 0)
      return
    }

    // this.overlay.clear()
    // this.overlay.beginFill(0xff0000, 1)

    // for (let box of this.boxes) {
    //   const { minX, minY, maxX, maxY } = box
    //   this.overlay.drawRect(minX, minY, maxX - minX, maxY - minY)
    // }

    // this.overlay.endFill()
  }

  clearSelection() {
    this.setSelectedBoxes([])
  }

  resize = (x: number, y: number, width: number, height: number) => {
    // this.clear()
    // this.draw(x, y, width, height)
    // this.calculateSelection()
  }

  handlePointerDown = (e: Pixi.InteractionEvent) => {
    this.status = "pointing"
    this.point = Point.fromInteractionEvent(e)
  }

  handlePointerUp = (e: Pixi.InteractionEvent) => {
    this.status = "idle"
  }

  handlePointerOver = (e: Pixi.InteractionEvent) => {
    if (this.status === "idle") {
      this.status = "hovered"
    }
  }

  handlePointerOut = (e: Pixi.InteractionEvent) => {
    if (this.status === "hovered") {
      this.status = "idle"
    }
  }

  handlePointerMove = (e: Pixi.InteractionEvent) => {
    const { point, status, x, y } = this

    if (
      status === "pointing" &&
      point &&
      point.distanceTo(Point.fromInteractionEvent(e)) > 4
    ) {
      this.status = "dragging"
    } else if (status === "dragging") {
      this.setTransform(x + pointer.delta.x, y + pointer.delta.y)
      for (let box of this.boxes) {
        box.moveTo(box.x + pointer.delta.x, box.y + pointer.delta.y)
      }
    }
  }
}

export default Selection

function getBoundingBox(boxes: SimpleBox[]) {
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
