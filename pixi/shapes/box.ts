import * as Pixi from "pixi.js"
import uniqueId from "lodash/uniqueId"
import Node from "./node"
import * as Types from "../types"

type BoxStyle = {
  stroke: number
  strokeWidth: number
  strokeOpacity: number
  fill: number
  fillOpacity: number
}

class Box extends Node<Box> {
  private _selected = false
  private _hovered = false
  private _graphics = new Pixi.Graphics()
  private _x: number
  private _y: number
  private _z: number
  private _height: number
  private _width: number
  private _opacity: number
  private _fill = 0xffffff
  private _stroke = 0x000000
  private _strokeWidth = 1
  private _strokeOpacity = 1
  private _fillOpacity = 0.9

  constructor(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    style: Partial<BoxStyle> = {}
  ) {
    super()

    this.name = "Box " + this.id

    this._x = Math.round(x)
    this._y = Math.round(y)
    this._z = Math.round(z)

    this._height = Math.round(height)
    this._width = Math.round(width)

    this.graphics.setTransform(this._x, this._y)
    this.setStyle(style)
  }

  protected _draw() {
    this.graphics.clear()
    this.graphics.beginFill(this._fill, this._fillOpacity)
    this.graphics.lineStyle(
      this._strokeWidth,
      this._stroke,
      this._strokeOpacity,
      0
    )
    this.graphics.drawRect(0, 0, this.width, this.height)
    this.graphics.endFill()

    this.draw() // Public method

    return this
  }

  // Public Methods

  public draw(): void {}

  public appendTo(a: Box | Pixi.Container) {
    if (a instanceof Box) {
      a.graphics.addChild(this.graphics)
    } else {
      a.addChild(this.graphics)
    }
  }

  public enlargedArea(b: Box) {
    return (
      (Math.max(b.maxX, this.maxX) - Math.min(b.minX, this.minX)) *
      (Math.max(b.maxY, this.maxY) - Math.min(b.minY, this.minY))
    )
  }

  public intersectionArea(b: Box) {
    const minX = Math.max(b.minX, b.minX)
    const minY = Math.max(b.minY, b.minY)
    const maxX = Math.min(b.maxX, b.maxX)
    const maxY = Math.min(b.maxY, b.maxY)

    return Math.max(0, maxX - minX) * Math.max(0, maxY - minY)
  }

  public contains(b: Box) {
    return (
      this.minX <= b.minX &&
      this.minY <= b.minY &&
      b.maxX <= this.maxX &&
      b.maxY <= this.maxY
    )
  }

  public intersects(b: Box) {
    return (
      b.minX <= this.maxX &&
      b.minY <= this.maxY &&
      b.maxX >= this.minX &&
      b.maxY >= this.minY
    )
  }

  public moveTo(x: number, y: number) {
    this._x = Math.round(x)
    this._y = Math.round(y)
    this.graphics.setTransform(this._x, this._y)
    return this
  }

  public moveBy(x: number, y: number) {
    this._x = Math.round(this._x + x)
    this._y = Math.round(this._y + y)
    this.graphics.setTransform(this._x, this._y)
    return this
  }

  public setPoint(x: number, y: number) {
    this.moveTo(x, y)
  }

  public setSize(width: number, height: number) {
    this._width = Math.round(width)
    this._height = Math.round(height)
    this._draw()
    return this
  }

  public setBounds(bounds: Types.Bounds) {
    const { minX, maxX, minY, maxY } = bounds
    this.setPoint(minX, minY)
    this.setSize(maxX - minX, maxY - minY)
  }

  public setFrame(x: number, y: number, width: number, height: number) {
    this.moveTo(x, y)
    this.setSize(width, height)
    return this
  }

  public getBounds() {
    return this._graphics.getBounds()
  }

  public getSimpleBox() {
    const { id, x, y, z, width, height } = this
    return { id, x, y, z, width, height }
  }

  public hide() {
    this.setFrame(-10, -10, 0, 0)
    this.opacity = 0
  }

  public show() {
    this.opacity = 1
  }

  public hitTest({ x, y }: Types.Point) {
    if (x < this.minX || x > this.maxX || y < this.minY || y > this.maxY) {
      return false
    } else {
      return { target: this, type: "body" }
    }
  }

  public setStyle(style: Partial<BoxStyle>) {
    const {
      stroke = this._stroke,
      strokeWidth = this._strokeWidth,
      strokeOpacity = this._strokeOpacity,
      fill = this._fill,
      fillOpacity = this._fillOpacity,
    } = style

    this._fill = fill
    this._stroke = stroke
    this._strokeWidth = strokeWidth
    this._strokeOpacity = strokeOpacity
    this._fillOpacity = fillOpacity
    this._draw()
  }

  public moveBack() {
    this.graphics.zIndex--
  }

  public moveForward() {
    this.graphics.zIndex++
  }

  public destroy() {
    this.graphics.clear()
    this.graphics.destroy({ children: true, texture: true, baseTexture: true })
  }

  // Getters / Setters

  get graphics() {
    return this._graphics
  }

  get x() {
    return this._x
  }
  set x(x: number) {
    this._x = Math.round(x)
    this._graphics.setTransform(this._x, this._y)
  }

  get y() {
    return this._y
  }
  set y(y: number) {
    this._y = Math.round(y)
    this._graphics.setTransform(this._x, this._y)
  }

  get z() {
    return this._z
  }
  set z(z: number) {
    this._z = Math.min(Math.max(0, z), this.graphics.parent.children.length - 1)
    this.graphics.parent.setChildIndex(this.graphics, this._z)
  }

  get minX() {
    return this._x
  }
  set minX(n: number) {
    this.x = n
  }

  get maxX() {
    return this._x + this._width
  }
  set maxX(n: number) {
    this.x = this.maxX - this.width
  }

  get minY() {
    return this._y
  }
  set minY(n: number) {
    this.y = n
  }

  get maxY() {
    return this._y + this._height
  }
  set maxY(n: number) {
    this.y = n - this.width
  }

  get width() {
    return this._width
  }
  set width(n: number) {
    this._width = Math.round(n)
    this._draw()
  }

  get height() {
    return this._height
  }
  set height(n: number) {
    this._height = Math.round(n)
    this._draw()
  }

  get opacity() {
    return this._opacity
  }
  set opacity(opacity: number) {
    this._opacity = opacity
    this._graphics.alpha = opacity
  }

  get fill() {
    return this._fill
  }
  set fill(color: number) {
    this._fill = color
    this._draw()
  }

  get fillOpacity() {
    return this._fillOpacity
  }
  set fillOpacity(opacity: number) {
    this._fillOpacity = opacity
    this._draw()
  }

  get stroke() {
    return this._stroke
  }
  set stroke(color: number) {
    this._stroke = color
    this._draw()
  }

  get strokeOpacity() {
    return this._stroke
  }
  set strokeOpacity(opacity: number) {
    this._strokeOpacity = opacity
    this._draw()
  }

  get strokeWidth() {
    return this._strokeWidth
  }
  set strokeWidth(width: number) {
    this._strokeWidth = width
    this._draw()
  }

  get selected() {
    return this._selected
  }
  set selected(selected: boolean) {
    this._selected = selected
    this.stroke = this._selected ? 0x0000ff : 0x000000
  }

  get hovered() {
    return this._hovered
  }
  set hovered(hovered: boolean) {
    this._hovered = hovered
    this.strokeWidth = this._hovered ? 2 : 1
    this.stroke = this._hovered || this._selected ? 0x0000ff : 0x000000
  }
}

export default Box
