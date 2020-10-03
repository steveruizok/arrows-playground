import {
	getDistance,
	getSector,
	modulate,
	getDelta,
	getAngle,
	rotatePoint,
	getPointBetween,
	doRectanglesCollide,
	getIntermediate,
	getLineBetweenRoundedRectangles,
	normalizeAngle,
	getRayRoundedRectangleIntersection,
	getRectangleSegmentIntersectedByRay,
} from "./utils"

export type ArrowOptions = {
	bow?: number
	stretchMin?: number
	stretchMax?: number
	stretch?: number
	padStart?: number
	padEnd?: number
	flip?: boolean
	straights?: boolean
}

const PI = Math.PI
const MIN_ANGLE = PI / 24

/**
 * getArrowBetweenBoxes
 * Get the points for a linking line between two boxes.
 * @param x0 The x-axis coordinate of the first box.
 * @param y0 The y-axis coordinate of the first box.
 * @param w0 The width of the first box.
 * @param h0 The height of the first box.
 * @param x1 The x-axis coordinate of the second box.
 * @param y1 The y-axis coordinate of the second box.
 * @param w1 The width of the second box.
 * @param h1 The height of the second box.
 * @param options
 */
export default function getBoxToBoxArrow(
	x0: number,
	y0: number,
	w0: number,
	h0: number,
	x1: number,
	y1: number,
	w1: number,
	h1: number,
	options: ArrowOptions = {} as ArrowOptions
) {
	let sx: number, sy: number, ex: number, ey: number, cx: number, cy: number

	const {
		bow = 0,
		stretch = 0.25,
		stretchMin = 50,
		stretchMax = 420,
		padStart = 0,
		padEnd = 20,
		flip = false,
		straights = true,
	} = options

	const px0 = x0 - padStart,
		py0 = y0 - padStart,
		pw0 = w0 + padStart * 2,
		ph0 = h0 + padStart * 2,
		px1 = x1 - padEnd,
		py1 = y1 - padEnd,
		pw1 = w1 + padEnd * 2,
		ph1 = h1 + padEnd * 2,
		cx0 = x0 + w0 / 2,
		cy0 = y0 + h0 / 2,
		cx1 = x1 + w1 / 2,
		cy1 = y1 + h1 / 2

	// Angle between centers
	const angle = getAngle(cx0, cy0, cx1, cy1)
	const sector = getSector(angle)

	switch (sector) {
		case 0: {
			sx = px0 + pw0
			sy = cy0
			ex = px1
			ey = cy1
			break
		}
		case 1: {
			sx = px0 + pw0
			sy = cy0
			ex = px1
			ey = cy1
			break
		}
		case 2: {
			sx = cx0
			sy = py0 + ph0
			ex = cx1
			ey = py1
			break
		}
		case 3: {
			sx = cx0
			sy = py0
			ex = cx1
			ey = py1 + ph1
			break
		}
		case 4: {
			sx = cx0
			sy = py0
			ex = cx1
			ey = py1 + ph1
			break
		}
		case 5: {
			sx = cx0
			sy = py0
			ex = cx1
			ey = py1 + ph1
			break
		}
		case 6: {
			sx = cx0
			sy = py0
			ex = cx1
			ey = py1 + ph1
			break
		}
		case 7: {
			sx = cx0
			sy = py0
			ex = cx1
			ey = py1 + ph1
			break
		}
	}

	// Distance between centers
	// const distance = getDistance(cx0, cy0, cx1, cy1)

	// Rotation of the arrow, clockwise or anticlockwise
	// const rot = (getSector(angle) % 2 === 0 ? -1 : 1) * (flip ? -1 : 1)

	// How cardinal is the angle? 0 = 45deg, 1 = 90deg
	// let card = getIntermediate(angle)

	// if (card < 1 && card > 0.85) card = 0.99

	// Are the boxes colliding / overlapping?
	// const isColliding = doRectanglesCollide(
	// 	px0,
	// 	py0,
	// 	pw0,
	// 	ph0,
	// 	px1,
	// 	py1,
	// 	pw1,
	// 	ph1
	// )

	// Direct line between boxes
	// ;[sx, sy, ex, ey] = getLineBetweenRoundedRectangles(
	// 	px0,
	// 	py0,
	// 	pw0,
	// 	ph0,
	// 	padStart,
	// 	px1,
	// 	py1,
	// 	pw1,
	// 	ph1,
	// 	padEnd
	// )

	// Length of the direct line between boxes
	// const distanceBetween = getDistance(sx, sy, ex, ey)

	// Midpoint between
	;[cx, cy] = getPointBetween(sx, sy, ex, ey, 0.5)

	const as = getAngle(sx, sy, cx, cy)
	const ae = getAngle(cx, cy, ex, ey)
	const ac = getAngle(cx0, cy0, cx1, cy1)

	return [sx, sy, cx, cy, ex, ey, ae, as, ac]
}
