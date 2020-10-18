import {
	doBoxesCollide,
	pointInRectangle,
	pointInCorner,
	pointInEdge,
} from "../utils"
import { S } from "@state-designer/react"
import { IBox, IPoint, IBrush, IFrame, IBounds } from "../../types"
import state, { pointerState } from "../state"

const PI2 = Math.PI * 2

export enum HitType {
	Canvas = "canvas",
	Bounds = "bounds",
	BoundsCorner = "bounds-corner",
	BoundsEdge = "bounds-edge",
	Box = "box",
}

export type Hit =
	| { type: HitType.Canvas }
	| { type: HitType.Bounds }
	| { type: HitType.BoundsCorner; corner: number }
	| { type: HitType.BoundsEdge; edge: number }
	| { type: HitType.Box; id: string }

class Surface {
	_lineWidth = 2
	_stroke: string
	_fill: string
	_unsub: () => void
	_looping = true

	cvs: HTMLCanvasElement
	ctx: CanvasRenderingContext2D
	state = state

	constructor(canvas: HTMLCanvasElement) {
		this.cvs = canvas
		this.ctx = canvas.getContext("2d")
		this.stroke = "#000"
		this.fill = "rgba(255, 255, 255, .5)"
		this.save()

		// this._unsub = this.state.onUpdate(() => {
		// 	this.clear()
		// 	this.draw()
		// })

		this.loop()
	}

	private loop = () => {
		if (!this._looping) return
		this.clear()
		this.draw()
		requestAnimationFrame(this.loop)
	}

	destroy() {
		this._looping = false
		// this._unsub()
	}

	draw() {
		const { camera, brush, bounds, boxes, selectedBoxIds } = this.state.data
		const hit = this.hitTest()

		const dpr = window.devicePixelRatio || 1

		this.ctx.translate(-camera.x * dpr, -camera.y * dpr)
		this.ctx.scale(camera.zoom * dpr, camera.zoom * dpr)
		this.lineWidth = 1 / camera.zoom

		this.renderBoxes()
		this.renderSelection()
		this.renderBrush()
		this.cvs.style.setProperty("cursor", this.getCursor(hit))
	}

	renderBoxes() {
		for (let box of Object.values(this.state.data.boxes)) {
			this.drawBox(box)
		}
	}

	renderSelection() {
		const { bounds, boxes, selectedBoxIds } = this.state.data

		if (selectedBoxIds.length > 0) {
			this.save()
			this.stroke = "blue"

			if (bounds) {
				// draw bounds outline
				this.drawBox(bounds)
			}

			// draw box outlines
			for (let id of selectedBoxIds) {
				let box = boxes[id]
				this.drawBox(box)
			}

			this.restore()
		}
	}

	renderBrush() {
		const { brush } = this.state.data
		if (brush) {
			this.save()
			this.stroke = "rgba(0,0,0,.2)"
			this.fill = "rgba(0,0,0,.1)"
			this.drawBrush(brush)
			this.restore()
		}
	}

	hitTest(): Hit {
		const point = pointerState.data.document
		const { camera, viewBox, boxes, bounds, selectedBoxIds } = this.state.data

		if (bounds) {
			// Test if point collides the (padded) bounds
			if (pointInRectangle(point, bounds, 16)) {
				// Test if point collides a (padded) corner
				const corner = pointInCorner(point, bounds, 8)
				if (corner !== undefined) {
					return { type: HitType.BoundsCorner, corner }
				}

				// Test if point collides a (padded) edge
				const edge = pointInEdge(point, bounds, 8)
				if (edge !== undefined) {
					return { type: HitType.BoundsEdge, edge }
				}

				// Point is in the middle of the bounds
				return { type: HitType.Bounds }
			}
		}

		// Either we don't have bounds or we're out of bounds
		for (let box of Object.values(boxes)) {
			// Test if box is in viewport
			if (!doBoxesCollide(box, viewBox.document)) continue

			// Test if point collides the (padded) box
			if (pointInRectangle(point, box)) {
				// Point is in the middle of the box
				return { type: HitType.Box, id: box.id }
			}
		}

		return { type: HitType.Canvas }
	}

	clear() {
		const { cvs, ctx } = this
		ctx.resetTransform()
		ctx.clearRect(0, 0, cvs.width, cvs.height)
		this.restore()
	}

	drawBox(box: IBox | IFrame) {
		const { ctx } = this
		const { x, y, width, height } = box
		const path = new Path2D()
		path.rect(x, y, width, height)
		ctx.fill(path)
		ctx.stroke(path)
	}

	drawCorner(point: IPoint) {
		const { ctx } = this
		const { x, y } = point
		ctx.beginPath()
		ctx.ellipse(x, y, 2, 2, 0, 0, PI2, false)
	}

	drawEdge(start: IPoint, end: IPoint) {
		const { ctx } = this
		ctx.beginPath()
		ctx.moveTo(start.x, start.y)
		ctx.lineTo(end.x, end.y)
		ctx.stroke()
	}

	drawBrush(brush: IBrush) {
		const { ctx } = this
		const { x0, y0, x1, y1 } = brush
		const path = new Path2D()
		path.rect(
			Math.min(x1, x0),
			Math.min(y1, y0),
			Math.abs(x1 - x0),
			Math.abs(y1 - y0)
		)
		ctx.fill(path)
		ctx.stroke(path)
	}

	getCursor(hit: Hit) {
		const { isIn } = this.state
		if (isIn("dragging")) {
			return "grab"
		}

		switch (hit.type) {
			case "box":
			case "bounds": {
				return "grab"
			}
			case "bounds-corner": {
				return hit.corner % 2 === 0 ? "nwse-resize" : "nesw-resize"
			}
			case "bounds-edge": {
				return hit.edge % 2 === 0 ? "ns-resize" : "ew-resize"
			}
			case "canvas": {
				return "pointer"
			}
		}
	}

	save() {
		this.ctx.save()
	}

	restore() {
		this.ctx.restore()
	}

	// Getters / Setters ----------------

	get stroke() {
		return this._stroke
	}

	set stroke(color: string) {
		this._stroke = color
		this.ctx.strokeStyle = color
	}

	get fill() {
		return this._fill
	}

	set fill(color: string) {
		this._fill = color
		this.ctx.fillStyle = color
	}

	get lineWidth() {
		return this._lineWidth
	}

	set lineWidth(width: number) {
		this._lineWidth = width
		this.ctx.lineWidth = width
	}
}

export default Surface
