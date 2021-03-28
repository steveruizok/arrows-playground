import Point from "./Point"

class Pointer extends Point {
  delta = new Point(0, 0)
  previous = new Point(0, 0)
  origin = new Point(0, 0)

  constructor() {
    super(0, 0)
  }

  set = (x: number, y?: number) => {
    this.copyTo(this.origin)
    let dx: number, dy: number
    dx = x - this.x
    this.x = x
    if (y === undefined) {
      dy = x - this.y
      this.y = x
    } else {
      dy = y - this.y
      this.y = y
    }

    this.delta.set(dx, dy)

    return this
  }

  deltaAngle() {
    return this.angleTo(new Point(this.x - this.delta.x, this.y - this.delta.y))
  }
}

export default new Pointer()
