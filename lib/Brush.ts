import Point from "./Point"
import * as Pixi from "pixi.js"
import App, { bush, interactions } from "./index"

class Brush extends Pixi.Graphics {
  origin = new Point(0, 0)
  bounds = new Pixi.Bounds()
  rect = new Pixi.Rectangle()
  app: App

  constructor(app: App) {
    super()
    this.app = app
  }

  start(x: number, y: number) {
    this.origin.set(x, y)
    // bush.clear()
    // bush.load(this.app.boxes)
  }

  stop() {
    this.clear()
  }

  bbox() {
    const point = interactions.mouse.getLocalPosition(this.app.app.stage)
    const minX = Math.min(point.x, this.origin.x)
    const maxX = Math.max(point.x, this.origin.x)
    const minY = Math.min(point.y, this.origin.y)
    const maxY = Math.max(point.y, this.origin.y)
    return { minX, minY, maxX, maxY }
  }

  async update() {
    const point = interactions.mouse.getLocalPosition(this.app.app.stage)
    const minX = Math.min(point.x, this.origin.x)
    const maxX = Math.max(point.x, this.origin.x)
    const minY = Math.min(point.y, this.origin.y)
    const maxY = Math.max(point.y, this.origin.y)

    this.clear()
    this.beginFill(0x0000ff, 0.5)
    this.drawRect(minX, minY, maxX - minX, maxY - minY)
    this.endFill()

    // const collisions = bush.search({ minX, minY, maxX, maxY })
    // this.app.setSelectedBoxes(collisions)
  }
}

export default Brush
