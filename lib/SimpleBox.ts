import Point from "./Point"

class SimpleBox {
  point: Point
  size: Point
  selected = false

  constructor(x: number, y: number) {
    this.point = new Point(x, y)
    this.size = new Point(4, 4)
  }

  moveTo(x: number, y: number) {
    this.point.set(x, y)
  }

  get minX() {
    return this.point.x
  }

  get x() {
    return this.point.x
  }

  get minY() {
    return this.point.y
  }

  get y() {
    return this.point.y
  }

  get width() {
    return this.size.x
  }

  get height() {
    return this.size.y
  }

  get maxX() {
    return this.x + this.width
  }

  get maxY() {
    return this.y + this.height
  }

  get bounds() {
    const { minX, minY, maxX, maxY } = this
    return {
      minX,
      minY,
      maxX,
      maxY,
    }
  }
}

export default SimpleBox
