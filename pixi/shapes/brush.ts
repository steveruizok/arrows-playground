import * as Types from "../types"
import * as Utils from "../utils"
import Box from "./box"

class Brush extends Box {
  corners = [
    new Box(-4, -4, 1, 8, 8, {
      stroke: 0x0000ff,
      fill: 0xffffff,
      fillOpacity: 1,
      strokeWidth: 1,
    }),
    new Box(-4, -4, 2, 8, 8, {
      stroke: 0x0000ff,
      fill: 0xffffff,
      fillOpacity: 1,
      strokeWidth: 1,
    }),
    new Box(-4, -4, 3, 8, 8, {
      stroke: 0x0000ff,
      fill: 0xffffff,
      fillOpacity: 1,
      strokeWidth: 1,
    }),
    new Box(-4, -4, 4, 8, 8, {
      stroke: 0x0000ff,
      fill: 0xffffff,
      fillOpacity: 1,
      strokeWidth: 1,
    }),
  ]

  constructor() {
    super(0, 0, 5, 0, 0, {
      stroke: 0x0000ff,
      fill: 0x0000ff,
      fillOpacity: 0.05,
      strokeWidth: 1,
    })

    for (let corner of this.corners) {
      this.graphics.addChild(corner.graphics)
    }
  }

  showCorners() {
    for (let corner of this.corners) {
      corner.show()
    }
  }

  hideCorners() {
    for (let corner of this.corners) {
      corner.hide()
    }
  }

  public draw() {
    if (this.corners) {
      this.corners[0].moveTo(-4, -4)
      this.corners[1].moveTo(this.width - 4, -4)
      this.corners[2].moveTo(this.width - 4, this.height - 4)
      this.corners[3].moveTo(-4, this.height - 4)
    }
  }

  public hitTest({ x, y }: Types.Point) {
    const { minX, minY, maxX, maxY } = this

    let p = this.height > 20 && this.width > 20 ? 10 : 4

    // EDGES
    if (
      !(
        // top edge
        (x < minX + p || x > maxX - p || y < minY - p || y > minY + p)
      )
    ) {
      return { target: this, type: "edge", edge: 0 }
    } else if (
      !(
        // right edge
        (x < maxX - p || x > maxX + p || y < minY + p || y > maxY - p)
      )
    ) {
      return { target: this, type: "edge", edge: 1 }
    } else if (
      !(
        // bottom edge
        (x < minX + p || x > maxX - p || y < maxY - p || y > maxY + p)
      )
    ) {
      return { target: this, type: "edge", edge: 2 }
    } else if (
      !(
        // left edge
        (x < minX - p || x > minX + p || y < minY + p || y > maxY - p)
      )
    ) {
      return { target: this, type: "edge", edge: 3 }
    }

    // CORNERS
    if (
      !(
        // top-left corner
        (x < minX - p || x > minX + p || y < minY - p || y > minY + p)
      )
    ) {
      return { target: this, type: "corner", corner: 0 }
    } else if (
      !(
        // top-right corner
        (x < maxX - p || x > maxX + p || y < minY - p || y > minY + p)
      )
    ) {
      return { target: this, type: "corner", corner: 1 }
    } else if (
      !(
        // bottom-right corner
        (x < maxX - p || x > maxX + p || y < maxY - p || y > maxY + p)
      )
    ) {
      return { target: this, type: "corner", corner: 2 }
    } else if (
      !(
        // bottom-left corner
        (x < minX - p || x > minX + p || y < maxY - p || y > maxY + p)
      )
    ) {
      return { target: this, type: "corner", corner: 3 }
    }

    // BODY
    if (!(x < minX || x > maxX || y < minY || y > maxY)) {
      return { target: this, type: "body" }
    }
  }

  fit(boxes: Box[]) {
    if (boxes.length > 0) {
      this.show()
      this.setBounds(Utils.Bounds.getBoundingBox(boxes))
    } else {
      this.hide()
    }
  }

  fitPoints(a: Types.Point, b: Types.Point) {
    const x = Math.min(a.x, b.x),
      y = Math.min(a.y, b.y),
      width = Math.abs(a.x - b.x),
      height = Math.abs(a.y - b.y)

    // draw brush
    this.show()
    this.setFrame(x, y, width, height)
  }
}

export default Brush
