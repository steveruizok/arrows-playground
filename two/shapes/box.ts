import Two from "two.js"
import uniqueId from "lodash/uniqueId"
import * as Types from "../types"

class Box {
  id = uniqueId()
  _graphics: Two.Rectangle
  _x: number
  _y: number
  _height: number
  _width: number

  constructor(x: number, y: number, width: number, height: number) {
    this._graphics = new Two.Rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height
    )
    this._graphics.linewidth = 0.5
    this._graphics.fill = "rgba(0, 255, 51, .05)"
    this._graphics.stroke = "#000"

    this._x = x
    this._y = y
    this._height = height
    this._width = width
    this.draw()
  }

  draw() {
    return this
  }

  moveTo(x: number, y: number) {
    this._x = x
    this._y = y
    this.graphics.translation.set(
      this._x + this.width / 2,
      this._y + this.height / 2
    )

    return this
  }

  moveBy(x: number, y: number) {
    this._x += x
    this._y += y
    this.graphics.translation.set(
      this._x + this.width / 2,
      this._y + this.height / 2
    )

    return this
  }

  setSize(width: number, height: number) {
    this._width = width
    this._height = height
    this.draw()
    return this
  }

  setFrame(x: number, y: number, width: number, height: number) {
    this.moveTo(x, y)
    this.setSize(width, height)
    return this
  }

  getBounds() {
    const { minX, maxX, minY, maxY } = this
    return { minX, maxX, minY, maxY }
  }

  getSimpleBox() {
    const { id, x, y, width, height } = this
    return { id, x, y, width, height }
  }

  set stroke(color: Two.Color) {
    this._graphics.stroke = color
  }

  get stroke() {
    return this._graphics.stroke
  }

  set fill(color: Two.Color) {
    this._graphics.fill = color
  }

  get fill() {
    return this._graphics.fill
  }

  get graphics() {
    return this._graphics
  }

  get x() {
    return this._x
  }
  set x(x: number) {
    this._x = x
    this.graphics.translation.set(
      this._x + this.width / 2,
      this._y + this.height / 2
    )
  }

  get y() {
    return this._y
  }
  set y(y: number) {
    this._y = y
    this.graphics.translation.set(
      this._x + this.width / 2,
      this._y + this.height / 2
    )
  }

  get minX() {
    return this._x
  }

  get maxX() {
    return this._x + this._width
  }

  get minY() {
    return this._y
  }

  get maxY() {
    return this._y + this._height
  }

  get width() {
    return this._width
  }

  get height() {
    return this._height
  }
}

export default Box
