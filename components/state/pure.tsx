interface Point {
	x: number
	y: number
}

interface Frame extends Point {
	width: number
	height: number
}

interface Bounds extends Frame {
	maxX: number
	maxY: number
}

interface Box extends Frame {
	id: string
}

interface BoxSnapshot extends Box {
	nx: number
	ny: number
	nmx: number
	nmy: number
	nw: number
	nh: number
}

function getBoundingBox(boxes: Box[]): Bounds {
	if (boxes.length === 0) {
		return {
			x: 0,
			y: 0,
			maxX: 0,
			maxY: 0,
			width: 0,
			height: 0,
		}
	}

	const first = boxes[0]

	let x = first.x
	let maxX = first.x + first.width
	let y = first.y
	let maxY = first.y + first.height

	for (let box of boxes) {
		x = Math.min(x, box.x)
		maxX = Math.max(maxX, box.x + box.width)
		y = Math.min(y, box.y)
		maxY = Math.max(maxY, box.y + box.height)
	}

	return {
		x,
		y,
		maxX,
		maxY,
		width: maxX - x,
		height: maxY - y,
	}
}

function getSnapshots(
	boxes: Box[],
	bounds: Bounds
): Record<string, BoxSnapshot> {
	const acc = {} as Record<string, BoxSnapshot>

	for (let box of boxes) {
		acc[box.id] = {
			...box,
			nx: (box.x - bounds.x) / bounds.width,
			ny: (box.y - bounds.y) / bounds.height,
			nmx: (box.x + box.width - bounds.x) / bounds.width,
			nmy: (box.y + box.height - bounds.y) / bounds.height,
			nw: box.width / bounds.width,
			nh: box.height / bounds.height,
		}
	}

	return acc
}

export function getEdgeResizer(boxes: Box[], edge: number) {
	const initial = getBoundingBox(boxes)
	const snapshots = getSnapshots(boxes, initial)
	const mboxes = [...boxes]

	let { x: x0, y: y0, maxX: x1, maxY: y1 } = initial
	let { x: mx, y: my, width: mw, height: mh } = initial

	return function edgeResize({ x, y }: Point) {
		if (edge === 0 || edge === 2) {
			edge === 0 ? (y0 = y) : (y1 = y)
			my = y0 < y1 ? y0 : y1
			mh = Math.abs(y1 - y0)
			for (let box of boxes) {
				const { ny, nmy, nh } = snapshots[box.id]
				box.y = my + (y1 < y0 ? nmy : ny) * mh
				box.height = nh * mh
			}
		} else {
			edge === 1 ? (x1 = x) : (x0 = x)
			mx = x0 < x1 ? x0 : x1
			mw = Math.abs(x1 - x0)
			for (let box of mboxes) {
				const { nx, nmx, nw } = snapshots[box.id]
				box.x = mx + (x1 < x0 ? nmx : nx) * mw
				box.width = nw * mw
			}
		}

		return [
			mboxes,
			{
				x: mx,
				y: my,
				w: mw,
				h: mh,
				maxX: mx + mw,
				maxY: my + mh,
			},
		] as const
	}
}

/**
 * Returns a function that can be used to calculate corner resize transforms.
 * @param boxes An array of the boxes being resized.
 * @param corner A number representing the corner being dragged. Top Left: 0, Top Right: 1, Bottom Right: 2, Bottom Left: 3.
 * @example
 * const resizer = getCornerResizer(selectedBoxes, 3)
 * resizer(selectedBoxes, )
 */
export function getCornerResizer(boxes: Box[], corner: number) {
	const initial = getBoundingBox(boxes)
	const snapshots = getSnapshots(boxes, initial)
	const mboxes = [...boxes]

	let { x: _x0, y: _y0, maxX: _x1, maxY: _y1 } = initial
	let { x: mx, y: my, width: mw, height: mh } = initial

	function cornerResizer(point: Point) {
		corner < 2 ? (_y0 = point.y) : (_y1 = point.y)
		my = _y0 < _y1 ? _y0 : _y1
		mh = Math.abs(_y1 - _y0)

		corner === 1 || corner === 2 ? (_x1 = point.x) : (_x0 = point.x)
		mx = _x0 < _x1 ? _x0 : _x1
		mw = Math.abs(_x1 - _x0)

		for (let box of mboxes) {
			const { nx, nmx, nw, ny, nmy, nh } = snapshots[box.id]
			box.x = mx + (_x1 < _x0 ? nmx : nx) * mw
			box.y = my + (_y1 < _y0 ? nmy : ny) * mh
			box.width = nw * mw
			box.height = nh * mh
		}

		return [
			mboxes,
			{
				x: mx,
				y: my,
				w: mw,
				h: mh,
				maxX: mx + mw,
				maxY: my + mh,
			},
		] as const
	}

	return cornerResizer
}
