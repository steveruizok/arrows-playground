import * as Pixi from "pixi.js"
import RBush from "rbush"
import Box from "./Box"
import Brush from "./Brush"
import SimpleBox from "./SimpleBox"
import Selection from "./Selection"
import pointer from "./pointer"
import { wrap } from "comlink"
import { SelectionApi } from "../workers/selection.worker"

/* --------------------- Shared --------------------- */

const worker = new Worker("../workers/selection.worker", {
  type: "module",
})

export const selectionApi = wrap<SelectionApi>(worker)

export const app = new Pixi.Application({
  // antialias: true,
  resolution: window.devicePixelRatio,
  autoDensity: true,
})

const graphics = new Pixi.Graphics()

export const interactions: Pixi.InteractionManager =
  app.renderer.plugins.interaction

class Bush<T extends Box> extends RBush<T> {
  toBBox(box: Box) {
    return {
      minX: box.x,
      maxX: box.x + box.width,
      minY: box.y,
      maxY: box.y + box.width,
    }
  }
}

export const bush = new Bush()

/* -------------------- App Class ------------------- */

type Status = "idle" | "brushing"

class App {
  app = app
  status: Status = "idle"
  background = new Pixi.Sprite(Pixi.Texture.WHITE)
  selection = new Selection(this)
  brush = new Brush(this)
  selectedBoxes: SimpleBox[] = []
  boxes: SimpleBox[] = []
  text = new Pixi.Text("Selected Boxes", "12px bold Arial")

  constructor(element: HTMLElement) {
    app.resizeTo = element
    app.resize()
    element.appendChild(app.view)

    app.loader.load(this.setup)
  }

  setup = () => {
    app.renderer.backgroundColor = 0x1d1d1d

    const boxes = 100000

    for (let i = 0; i < boxes; i++) {
      this.createBox(
        100 + Math.random() * (window.innerWidth - 200),
        100 + Math.random() * (window.innerHeight - 200),
        4 + Math.random() * 8,
        4 + Math.random() * 8
      )
    }

    // const cols = 200
    // const cellSize = Math.ceil(window.innerWidth / cols)
    // const rows = Math.trunc(window.innerHeight / cellSize)
    // console.log("Creating " + rows * cols + " boxes")

    // this.boxes = Array.from(Array(rows * cols)).map((_, i) => {
    //   const x = (i % cols) * cellSize
    //   const y = Math.floor(i / cols) * cellSize
    //   return new Box(x, y, cellSize - 4, cellSize - 4, this)
    // })

    this.background.width = app.screen.width
    this.background.height = app.screen.height
    this.background.interactive = true
    this.background.tint = 0x333333

    this.text.setTransform(24, 24)

    app.stage.addChild(this.background)
    app.stage.addChild(graphics)
    // app.stage.addChild(...this.boxes)
    app.stage.addChild(this.selection)
    app.stage.addChild(this.brush)
    app.stage.addChild(this.text)

    // Event Listeners
    this.background.addListener("pointerdown", this.handlePointerDown)
    interactions.addListener("pointerup", this.handlePointerUp)
    interactions.addListener("pointermove", this.handlePointerMove)

    graphics.clear()
    graphics.beginFill(0xffffff, 0.1)
    graphics.lineStyle(1, 0xffffff, 1)
    for (let box of this.boxes) {
      const { x, y, width, height } = box
      graphics.drawRect(x, y, width, height)
    }
    graphics.endFill()

    app.ticker.add((delta) => this.loop(delta))
  }

  loop = (delta: number) => {
    if (this.selection.status === "dragging") {
      graphics.clear()
      graphics.beginFill(0xffffff, 0.1)
      graphics.lineStyle(1, 0xffffff, 1)
      for (let box of this.boxes) {
        const { x, y, width, height } = box
        graphics.drawRect(x, y, width, height)
      }
      graphics.endFill()
    }

    // graphics.lineStyle(1, 0xff0000, 1)
    // for (let box of this.selectedBoxes) {
    //   const { x, y, width, height } = box
    //   graphics.drawRect(x, y, width, height)
    // }
  }

  createBox(x: number, y: number, height: number, width: number) {
    // const box = new Box(x, y, width, height, this)
    const box = new SimpleBox(x, y)
    this.boxes.push(box)
    return box
  }

  // Selection

  setSelectedBoxes = (boxes: SimpleBox[]) => {
    this.selection.setSelectedBoxes(boxes)
    this.text.text = boxes.length.toString()
  }

  drawSelection = () => {
    // this.selection.calculateBounds()
    // this.selection.resize(minX, minY, maxX - minX, maxY - minY)
    // this.selection.tra
    // this.selection.beginFill(0x0000ff, 0.5)
    // this.selection.lineStyle(1, 0x0000ff, 1)
    // this.selection.calculateBounds()
    // const { minX, minY, maxX, maxY } = this.selection._bounds
    // this.selection.drawRect(minX, minY, maxX - minX, maxY - minY)
    // this.selection.endFill()
  }

  // Event Handlers

  handlePointerMove = async (e: Pixi.InteractionEvent) => {
    const { x, y } = e.data.global
    pointer.set(x, y)

    if (this.status === "brushing" && this.brush) {
      this.brush.update()

      const { minX, maxX, minY, maxY } = this.brush.bbox()
      const result = await selectionApi.search(minX, minY, maxX, maxY)

      const boxes = result.map((id) => this.boxes[id])
      this.setSelectedBoxes(boxes)
    }
  }

  handlePointerDown = async (e: Pixi.InteractionEvent) => {
    this.selection.clearSelection()
    this.status = "brushing"
    this.brush.start(pointer.x, pointer.y)

    let boxes = this.boxes.map((box, i) => {
      return {
        id: i,
        ...box.bounds,
      }
    })

    selectionApi.setBoxes(boxes)
  }

  handlePointerUp = (e: Pixi.InteractionEvent) => {
    if (this.status === "brushing" && this.brush) {
      this.brush.stop()
      this.selection.drawBounds()
      this.status = "idle"
    }
  }
}

export default App
