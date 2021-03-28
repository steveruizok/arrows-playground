import * as Pixi from "pixi.js"

class Point extends Pixi.Point {
  negative = () => {
    return new Point(-this.x, -this.y)
  }
  add = (v: Point | number) => {
    if (v instanceof Point) return new Point(this.x + v.x, this.y + v.y)
    else return new Point(this.x + v, this.y + v)
  }
  subtract = (v: Point | number) => {
    if (v instanceof Point) return new Point(this.x - v.x, this.y - v.y)
    else return new Point(this.x - v, this.y - v)
  }
  multiply = (v: Point | number) => {
    if (v instanceof Point) return new Point(this.x * v.x, this.y * v.y)
    else return new Point(this.x * v, this.y * v)
  }
  divide = (v: Point | number) => {
    if (v instanceof Point) return new Point(this.x / v.x, this.y / v.y)
    else return new Point(this.x / v, this.y / v)
  }
  equals = (v: Point) => {
    return this.x === v.x && this.y === v.y
  }
  dot = (v: Point) => {
    return this.x * v.x + this.y * v.y
  }
  cross = (v: Point) => {
    return this.x * v.x + this.y * v.y
  }
  length = () => {
    return Math.sqrt(this.dot(this))
  }
  unit = () => {
    return this.divide(this.length())
  }
  min = () => {
    return Math.min(Math.min(this.x, this.y))
  }
  max = () => {
    return Math.max(Math.max(this.x, this.y))
  }
  angleTo = (a: Point) => {
    return Math.acos(this.dot(a) / (this.length() * a.length()))
  }
  distanceTo = (a: Point) => {
    return Math.hypot(a.y - this.y, a.x - this.x)
  }
  toArray = (n = 2) => {
    return [this.x, this.y].slice(0, n || 2)
  }
  toObject = () => {
    return { x: this.x, y: this.y }
  }
  clone = () => {
    return new Point(this.x, this.y)
  }

  // init = (x: number, y: number) => {
  //   this.x = x
  //   this.y = y
  //   return this
  // }

  static negative(a: Point, b: Point) {
    b.set(-a.x, -a.y)
    return b
  }

  static add(a: Point, b: number, c: Point): Point
  static add(a: Point, b: Point, c: Point): Point
  static add(a: Point, b: Point | number, c: Point): Point {
    if (b instanceof Point) {
      c.set(a.x + b.x, a.y + b.y)
    } else {
      c.set(a.x + b, a.y + b)
    }
    return c
  }
  static subtract(a: Point, b: number, c: Point): Point
  static subtract(a: Point, b: Point, c: Point): Point
  static subtract(a: Point, b: Point | number, c: Point): Point {
    if (b instanceof Point) {
      c.set(a.x - b.x, a.y - b.y)
    } else {
      c.set(a.x - b, a.y - b)
    }
    return c
  }
  static multiply(a: Point, b: number, c: Point): Point
  static multiply(a: Point, b: Point, c: Point): Point
  static multiply(a: Point, b: Point | number, c: Point): Point {
    if (b instanceof Point) {
      c.set(a.x * b.x, a.y * b.y)
    } else {
      c.set(a.x * b, a.y * b)
    }
    return c
  }
  static divide(a: Point, b: number, c: Point): Point
  static divide(a: Point, b: Point, c: Point): Point
  static divide(a: Point, b: Point | number, c: Point): Point {
    if (b instanceof Point) {
      c.set(a.x / b.x, a.y / b.y)
    } else {
      c.set(a.x / b, a.y / b)
    }
    return c
  }
  static cross(a: Point, b: Point, c: Point) {
    return a.x * b.y - a.y * b.x
  }
  static unit(a: Point, b: Point) {
    var length = a.length()
    b.set(a.x / length, a.y / length)
    return b
  }

  static fromAngles(theta: number, phi: number) {
    return new Point(Math.cos(theta) * Math.cos(phi), Math.sin(phi))
  }
  static randomDirection() {
    return this.fromAngles(
      Math.random() * Math.PI * 2,
      Math.asin(Math.random() * 2 - 1)
    )
  }
  static min(a: Point, b: Point) {
    return new Point(Math.min(a.x, b.x), Math.min(a.y, b.y))
  }
  static max(a: Point, b: Point) {
    return new Point(Math.max(a.x, b.x), Math.max(a.y, b.y))
  }
  static lerp(a: Point, b: Point, fraction: number) {
    return b.subtract(a).multiply(fraction).add(a)
  }
  static fromArray(a: number[]) {
    return new Point(a[0], a[1])
  }
  static angleBetween(a: Point, b: Point) {
    return a.angleTo(b)
  }
  static distanceBetween(a: Point, b: Point) {
    return a.distanceTo(b)
  }
}

export default Point
