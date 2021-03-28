import Point from "./Point"
import * as Pixi from "pixi.js"
import App, { bush } from "./index"

type Status = "idle" | "pointing" | "dragging" | "hovered"

class Box extends Pixi.Graphics {
  app: App
  status: Status = "idle"
  point?: Point

  constructor(x: number, y: number, width: number, height: number, app: App) {
    super()
    this.app = app
    this.draw(width, height)
    this.setTransform(x, y)

    // this.interactive = true
    // this.buttonMode = true

    // this.addListener("pointerdown", this.handlePointerDown)
    // this.addListener("pointerup", this.handlePointerUp)
    // this.addListener("pointerupoutside", this.handlePointerUp)
    // this.addListener("pointerover", this.handlePointerOver)
    // this.addListener("pointerout", this.handlePointerOut)
  }

  draw = (width: number, height: number) => {
    this.clear()
    this.beginFill(0xffffff, 0.05)
    this.lineStyle(1, 0xffffff, 1)
    this.drawRect(0, 0, width, height)
    this.endFill()
    this.calculateBounds()
  }

  moveTo(x: number, y: number) {
    this.x = x
    this.y = y
    return this
  }

  resize(x: number, y: number, width: number, height: number) {
    this.setTransform(x, y)
    this.draw(width, height)
    this.calculateBounds()
  }

  handlePointerDown = (e: Pixi.InteractionEvent) => {
    this.status = "pointing"
    this.point = Point.fromInteractionEvent(e)
    // this.app.setSelectedBoxes([this])
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
}

export default Box
