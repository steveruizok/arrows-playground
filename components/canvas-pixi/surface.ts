import * as PIXI from "pixi.js"
import { doBoxesCollide, pointInRectangle, getCorners, camera } from "../utils"
import { getArrow, getBoxToBoxArrow } from "perfect-arrows"
import {
	IBox,
	IPoint,
	IBounds,
	IBrush,
	IFrame,
	IArrow,
	IArrowType,
} from "../../types"
import state, { pointerState, steady } from "../state"
import * as Comlink from "comlink"

const arrowCache: number[][] = []

const PI2 = Math.PI * 2

const dpr = window.devicePixelRatio || 1

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

type ServiceRequest = (type: string, payload: any) => Promise<Hit>

const getFromWorker = Comlink.wrap<ServiceRequest>(
	new Worker("service.worker.js")
)

class Surface {
	_lineWidth = 2
	_stroke: string
	_fill: string
	_unsub: () => void
	_diffIndex = 0
	_looping = true
	cvs: HTMLCanvasElement
	ctx: CanvasRenderingContext2D

	allBoxes: IBox[] = []
	hit: Hit = { type: HitType.Canvas }

	app: PIXI.Application
	graphics: PIXI.Graphics
	scale: PIXI.ObservablePoint

	state = state
	hoveredId = ""

	constructor(canvas: HTMLCanvasElement, app: PIXI.Application) {
		this.cvs = canvas
		this.app = app
		this.graphics = new PIXI.Graphics()

		this.app.renderer.backgroundColor = 0xefefef
		this.scale = new PIXI.ObservablePoint(
			() => {},
			this.app,
			state.data.camera.zoom * dpr,
			state.data.camera.zoom * dpr
		)

		const setup = () => {
			const { graphics } = this
			//Start the game loop
			const boxes = Object.values(steady.boxes).sort((a, b) => b.z - a.z)
			getFromWorker("updateHitTree", boxes)

			graphics.lineStyle(1 / state.data.camera.zoom, 0x000000, 1)
			graphics.beginFill(0xffffff, 0.9)
			for (let box of boxes) {
				graphics.drawRect(box.x, box.y, box.width, box.height)
			}
			graphics.endFill()
			this.app.stage.addChild(graphics)

			this.app.ticker.add((delta) => gameLoop(delta))
		}

		const setHit = async () => {
			this.hit = await getFromWorker("hitTest", {
				point: pointerState.data.document,
				bounds: steady.bounds,
				zoom: this.state.data.camera.zoom,
			})
			this.cvs.style.setProperty("cursor", this.getCursor(this.hit))
		}

		const gameLoop = (delta: number) => {
			this.setupCamera()

			if (state.isIn("selectingIdle")) {
				setHit()
			}

			let id = ""
			if (this.hit.type === "box") id = this.hit.id

			if (id !== this.hoveredId) {
				this.hoveredId = id
				if (state.index === this._diffIndex) {
					this.clear()
					this.draw()
				}
			}

			if (state.index === this._diffIndex) {
				return
			}

			if (state.isIn("selectingIdle")) {
				this.allBoxes = Object.values(steady.boxes)
				this.allBoxes = this.allBoxes.sort((a, b) => a.z - b.z)
				getFromWorker("updateHitTree", this.allBoxes)
			}

			this.clear()
			this.draw()

			this._diffIndex = state.index
		}

		this.app.loader.load(setup)

		this.app.start()
	}

	destroy() {
		this._looping = false
		this.app.destroy()
	}

	draw() {
		this.drawBoxes()
		this.drawBrush()
		this.drawSelection()

		// if (this.state.isInAny("dragging")) {
		//   this.computeArrows()
		// }

		// this.drawArrows()
		// this.drawSelection()
	}

	setupCamera() {
		const { camera } = this.state.data

		this.graphics.setTransform(
			-camera.x,
			-camera.y,
			camera.zoom,
			camera.zoom,
			0,
			0,
			0,
			0,
			0
		)
	}

	forceCompute() {
		this.computeArrows()
	}

	renderCanvasThings() {
		this.stroke = "#000"
		this.fill = "rgba(255, 255, 255, .2)"

		for (let i = this.allBoxes.length - 1; i > -1; i--) {
			this.drawBox(this.allBoxes[i])
		}

		const allSpawningBoxes = Object.values(steady.spawning.boxes)

		for (let box of allSpawningBoxes) {
			this.save()
			this.stroke = "blue"
			this.drawBox(box)
			this.restore()
		}
	}

	drawBoxes() {
		const { graphics } = this
		const boxes = Object.values(steady.boxes)
		graphics.lineStyle(1 / this.state.data.camera.zoom, 0x000000, 1)
		graphics.beginFill(0xffffff, 0.9)

		for (let box of boxes) {
			graphics.drawRect(box.x, box.y, box.width, box.height)
		}

		const allSpawningBoxes = Object.values(steady.spawning.boxes)
		if (allSpawningBoxes.length > 0) {
			graphics.lineStyle(1 / this.state.data.camera.zoom, 0x0000ff, 1)

			for (let box of allSpawningBoxes) {
				graphics.drawRect(box.x, box.y, box.width, box.height)
			}
		}

		graphics.endFill()
	}

	drawSelection() {
		const { graphics } = this
		const { boxes, bounds } = steady
		const { camera, selectedBoxIds } = this.state.data

		graphics.lineStyle(1 / camera.zoom, 0x0000ff, 1)

		if (selectedBoxIds.length > 0) {
			// draw box outlines
			for (let id of selectedBoxIds) {
				let box = boxes[id]
				graphics.drawRect(box.x, box.y, box.width, box.height)
			}
		}

		if (
			bounds &&
			selectedBoxIds.length > 0 &&
			!this.state.isIn("brushSelecting")
		) {
			// draw bounds outline
			graphics.drawRect(bounds.x, bounds.y, bounds.width, bounds.height)
			graphics.beginFill(0x0000ff, 1)
			for (let [x, y] of getCorners(
				bounds.x,
				bounds.y,
				bounds.width,
				bounds.height
			)) {
				graphics.drawCircle(x, y, 3 / camera.zoom)
			}
			graphics.endFill()
		}

		if (this.hit.type === "box") {
			graphics.lineStyle(1.5 / camera.zoom, 0x0000ff, 1)
			const box = steady.boxes[this.hit.id]
			if (!box) {
				this.hit = { type: HitType.Canvas }
			} else {
				graphics.drawRect(box.x, box.y, box.width, box.height)
			}
		}
	}

	hitTest(): Hit {
		const point = pointerState.data.document
		const { bounds } = steady
		const { camera, viewBox } = this.state.data

		if (bounds) {
			// Test if point collides the (padded) bounds
			if (pointInRectangle(point, bounds, 16)) {
				const { x, y, width, height, maxX, maxY } = bounds
				const p = 5 / camera.zoom
				const pp = p * 2

				const cornerBoxes = [
					{ x: x - p, y: y - p, width: pp, height: pp },
					{ x: maxX - p, y: y - p, width: pp, height: pp },
					{ x: maxX - p, y: maxY - p, width: pp, height: pp },
					{ x: x - p, y: maxY - p, width: pp, height: pp },
				]

				for (let i = 0; i < cornerBoxes.length; i++) {
					if (pointInRectangle(point, cornerBoxes[i])) {
						return { type: HitType.BoundsCorner, corner: i }
					}
				}

				const edgeBoxes = [
					{ x: x + p, y: y - p, width: width - pp, height: pp },
					{ x: maxX - p, y: y + p, width: pp, height: height - pp },
					{ x: x + p, y: maxY - p, width: width - pp, height: pp },
					{ x: x - p, y: y + p, width: pp, height: height - pp },
				]

				for (let i = 0; i < edgeBoxes.length; i++) {
					if (pointInRectangle(point, edgeBoxes[i])) {
						return { type: HitType.BoundsEdge, edge: i }
					}
				}
				// Point is in the middle of the bounds
				return { type: HitType.Bounds }
			}
		}

		// Either we don't have bounds or we're out of bounds
		for (let box of this.allBoxes.filter((box) =>
			doBoxesCollide(box, viewBox.document)
		)) {
			// Test if point collides the (padded) box
			if (pointInRectangle(point, box)) {
				// Point is in the middle of the box
				return { type: HitType.Box, id: box.id }
			}
		}

		return { type: HitType.Canvas }
	}

	clear() {
		// Reset transform?
		this.graphics.clear()
	}

	drawBox(box: IBox | IFrame) {
		const { ctx } = this
		const { x, y, width, height } = box
		const path = new Path2D()
		path.rect(x, y, width, height)
		ctx.fill(path)
		ctx.stroke(path)
	}

	drawDot(x: number, y: number, radius = 4) {
		const r = radius / this.state.data.camera.zoom
		const { ctx } = this
		ctx.beginPath()
		ctx.ellipse(x, y, r, r, 0, 0, PI2, false)
		ctx.fill()
	}

	drawEdge(start: IPoint, end: IPoint) {
		const { ctx } = this
		ctx.beginPath()
		ctx.moveTo(start.x, start.y)
		ctx.lineTo(end.x, end.y)
		ctx.stroke()
	}

	drawBrush() {
		const { graphics } = this
		const { brush } = steady

		if (!brush) return

		const { x0, y0, x1, y1 } = brush
		graphics.lineStyle(1 / this.state.data.camera.zoom, 0x00aaff, 1)
		graphics.beginFill(0x00aaff, 0.05)
		graphics.drawRect(
			Math.min(x1, x0),
			Math.min(y1, y0),
			Math.abs(x1 - x0),
			Math.abs(y1 - y0)
		)
		graphics.endFill()
	}

	computeArrows() {
		const { arrows, boxes } = steady
		let sx: number,
			sy: number,
			cx: number,
			cy: number,
			ex: number,
			ey: number,
			ea: number

		arrowCache.length = 0

		for (let id in arrows) {
			const arrow = arrows[id]

			switch (arrow.type) {
				case IArrowType.BoxToBox: {
					const from = boxes[arrow.from]
					const to = boxes[arrow.to]
					if (from.id === to.id) {
					}
					// Box to Box Arrow
					;[sx, sy, cx, cy, ex, ey, ea] = getBoxToBoxArrow(
						from.x,
						from.y,
						from.width,
						from.height,
						to.x,
						to.y,
						to.width,
						to.height
					)

					break
				}
				case IArrowType.BoxToPoint: {
					const from = boxes[arrow.from]
					const to = arrow.to
					// Box to Box Arrow
					;[sx, sy, cx, cy, ex, ey, ea] = getBoxToBoxArrow(
						from.x,
						from.y,
						from.width,
						from.height,
						to.x,
						to.y,
						1,
						1
					)

					break
				}
				case IArrowType.PointToBox: {
					const from = arrow.from
					const to = boxes[arrow.to]
					// Box to Box Arrow
					;[sx, sy, cx, cy, ex, ey, ea] = getBoxToBoxArrow(
						from.x,
						from.y,
						1,
						1,
						to.x,
						to.y,
						to.width,
						to.height
					)

					break
				}
				case IArrowType.PointToPoint: {
					const { from, to } = arrow
					// Box to Box Arrow
					;[sx, sy, cx, cy, ex, ey, ea] = getArrow(from.x, from.y, to.x, to.y)

					break
				}
			}

			arrowCache.push([sx, sy, cx, cy, ex, ey, ea])
		}
	}

	drawArrows() {
		const { zoom } = this.state.data.camera

		// for (let [sx, sy, cx, cy, ex, ey, ea] of arrowCache) {
		//   const { ctx } = this
		//   ctx.save()
		//   this.stroke = "#000"
		//   this.fill = "#000"
		//   this.lineWidth = 1 / zoom
		//   ctx.beginPath()
		//   ctx.moveTo(sx, sy)
		//   ctx.quadraticCurveTo(cx, cy, ex, ey)
		//   ctx.stroke()
		//   this.drawDot(sx, sy)
		//   this.drawArrowhead(ex, ey, ea)
		//   ctx.restore()
		// }
	}

	drawArrowhead(x: number, y: number, angle: number) {
		const { ctx } = this
		const r = 5 / this.state.data.camera.zoom
		ctx.save()
		ctx.translate(x, y)
		ctx.rotate(angle)
		ctx.beginPath()
		ctx.moveTo(0, -r)
		ctx.lineTo(r * 2, 0)
		ctx.lineTo(0, r)
		ctx.closePath()
		ctx.fill()
		ctx.restore()
	}

	getCursor(hit: Hit) {
		const { isIn } = this.state

		if (isIn("dragging")) return "none"

		switch (hit.type) {
			case "box":
			case "bounds": {
				return "default"
			}
			case "bounds-corner": {
				return hit.corner % 2 === 0 ? "nwse-resize" : "nesw-resize"
			}
			case "bounds-edge": {
				return hit.edge % 2 === 0 ? "ns-resize" : "ew-resize"
			}
			case "canvas": {
				return "default"
			}
		}

		return "default"
	}

	save() {
		this.ctx.save()
	}

	restore() {
		this.ctx.restore()
	}

	resize() {
		this.app.resize()
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
