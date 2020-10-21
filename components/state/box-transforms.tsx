import { IBoxSnapshot, IPoint, IPointer, IBounds, IBox } from "../../types"

export function stretchBoxesX(boxes: IBox[]) {
	const [first, ...rest] = boxes
	let min = first.x
	let max = first.x + first.width
	for (let box of rest) {
		min = Math.min(min, box.x)
		max = Math.max(max, box.x + box.width)
	}
	for (let box of boxes) {
		box.x = min
		box.width = max - min
	}
}
export function stretchBoxesY(boxes: IBox[]) {
	const [first, ...rest] = boxes
	let min = first.y
	let max = first.y + first.height
	for (let box of rest) {
		min = Math.min(min, box.y)
		max = Math.max(max, box.y + box.height)
	}
	for (let box of boxes) {
		box.y = min
		box.height = max - min
	}
}
export function distributeBoxesX(boxes: IBox[]) {
	const [first, ...rest] = boxes
	let min = first.x
	let max = first.x + first.width
	let sum = first.width

	for (let box of rest) {
		min = Math.min(min, box.x)
		max = Math.max(max, box.x + box.width)
		sum += box.width
	}

	let t = min
	const gap = (max - min - sum) / (boxes.length - 1)
	for (let box of [...boxes].sort((a, b) => a.x - b.x)) {
		box.x = t
		t += box.width + gap
	}
}
export function distributeBoxesY(boxes: IBox[]) {
	const [first, ...rest] = boxes
	let min = first.y
	let max = first.y + first.height
	let sum = first.height

	for (let box of rest) {
		min = Math.min(min, box.y)
		max = Math.max(max, box.y + box.height)
		sum += box.height
	}

	let t = min
	const gap = (max - min - sum) / (boxes.length - 1)
	for (let box of [...boxes].sort((a, b) => a.y - b.y)) {
		box.y = t
		t += box.height + gap
	}
}
export function alignBoxesCenterX(boxes: IBox[]) {
	let midX = 0
	for (let box of boxes) {
		midX += box.x + box.width / 2
	}
	midX /= boxes.length
	for (let box of boxes) box.x = midX - box.width / 2
}
export function alignBoxesCenterY(boxes: IBox[]) {
	let midY = 0
	for (let box of boxes) midY += box.y + box.height / 2
	midY /= boxes.length
	for (let box of boxes) box.y = midY - box.height / 2
}

export function alignBoxesTop(boxes: IBox[]) {
	const [first, ...rest] = boxes
	let y = first.y
	for (let box of rest) if (box.y < y) y = box.y
	for (let box of boxes) box.y = y
}

export function alignBoxesBottom(boxes: IBox[]) {
	const [first, ...rest] = boxes
	let maxY = first.y + first.height
	for (let box of rest) if (box.y + box.height > maxY) maxY = box.y + box.height
	for (let box of boxes) box.y = maxY - box.height
}

export function alignBoxesLeft(boxes: IBox[]) {
	const [first, ...rest] = boxes
	let x = first.x
	for (let box of rest) if (box.x < x) x = box.x
	for (let box of boxes) box.x = x
}

export function alignBoxesRight(boxes: IBox[]) {
	const [first, ...rest] = boxes
	let maxX = first.x + first.width
	for (let box of rest) if (box.x + box.width > maxX) maxX = box.x + box.width
	for (let box of boxes) box.x = maxX - box.width
}

export function getBoundingBox(boxes: IBox[]): IBounds {
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
	boxes: IBox[],
	initial: IBounds
): Record<string, IBoxSnapshot> {
	return Object.fromEntries(
		boxes.map((box) => [
			box.id,
			{
				...box,
				nx: (box.x - initial.x) / initial.width,
				ny: (box.y - initial.y) / initial.height,
				nmx: 1 - (box.x + box.width - initial.x) / initial.width,
				nmy: 1 - (box.y + box.height - initial.y) / initial.height,
				nw: box.width / initial.width,
				nh: box.height / initial.height,
			},
		])
	)
}

export function getEdgeResizer(boxes: IBox[], edge: number) {
	const initial = getBoundingBox(boxes)
	const snapshots = getSnapshots(boxes, initial)

	// Mutable values of the bounding box, used internally
	let { x: _x0, y: _y0, maxX: _x1, maxY: _y1 } = initial

	// A function to mutate arguments (boxes and current bounds) based on edge and point.
	return function edgeResize(boxes: IBox[], current: IBounds, point: IPointer) {
		if (edge === 0 || edge === 2) {
			edge === 0 ? (_y0 = point.y) : (_y1 = point.y)
			current.y = _y0 < _y1 ? _y0 : _y1
			current.height = Math.abs(_y1 - _y0)
			current.maxY = current.y + current.height
			for (let box of boxes) {
				const { ny, nmy, nh } = snapshots[box.id]
				box.y = current.y + (_y1 < _y0 ? nmy : ny) * current.height
				box.height = nh * current.height
			}
		} else {
			edge === 1 ? (_x1 = point.x) : (_x0 = point.x)
			current.x = _x0 < _x1 ? _x0 : _x1
			current.width = Math.abs(_x1 - _x0)
			current.maxX = current.x + current.width
			for (let box of boxes) {
				const { nx, nmx, nw } = snapshots[box.id]
				box.x = current.x + (_x1 < _x0 ? nmx : nx) * current.width
				box.width = nw * current.width
			}
		}
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
export function getCornerResizer(boxes: IBox[], corner: number) {
	const initial = getBoundingBox(boxes)
	const snapshots = getSnapshots(boxes, initial)

	// Mutable values of the bounding box, used internally
	let { x: _x0, y: _y0, maxX: _x1, maxY: _y1 } = initial

	/**
	 * A function that will resize the boxes. This is designed to mutate its arguments.
	 * @param boxes The current array of boxes.
	 * @param current The current bounding box.
	 * @param point The pointer.
	 */
	function cornerResizer(boxes: IBox[], current: IBounds, point: IPointer) {
		// Top
		corner < 2 ? (_y0 = point.y) : (_y1 = point.y)
		current.y = _y0 < _y1 ? _y0 : _y1
		current.height = Math.abs(_y1 - _y0)
		current.maxY = current.y + current.height

		corner === 1 || corner === 2 ? (_x1 = point.x) : (_x0 = point.x)
		current.x = _x0 < _x1 ? _x0 : _x1
		current.width = Math.abs(_x1 - _x0)
		current.maxX = current.x + current.width

		for (let box of boxes) {
			const { nx, nmx, nw, ny, nmy, nh } = snapshots[box.id]
			box.x = current.x + (_x1 < _x0 ? nmx : nx) * current.width
			box.y = current.y + (_y1 < _y0 ? nmy : ny) * current.height
			box.width = nw * current.width
			box.height = nh * current.height
		}

		return current
	}

	return cornerResizer
}

export type EdgeResizer = ReturnType<typeof getEdgeResizer>
export type CornerResizer = ReturnType<typeof getCornerResizer>
