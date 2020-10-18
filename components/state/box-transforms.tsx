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

export function getEdgeResizer(boxes: IBox[], edge: number) {
	const bounds = getBoundingBox(boxes)

	const snapshots: Record<string, IBoxSnapshot> = Object.fromEntries(
		boxes.map((box) => [
			box.id,
			{
				...box,
				nx: (box.x - bounds.x) / bounds.width,
				ny: (box.y - bounds.y) / bounds.height,
				nmx: (box.x + box.width - bounds.x) / bounds.width,
				nmy: (box.y + box.height - bounds.y) / bounds.height,
				nw: box.width / bounds.width,
				nh: box.height / bounds.height,
			},
		])
	)

	return function edgeResize(boxes: IBox[], current: IBounds, point: IPointer) {
		const { x, y } = point
		let snap: IBoxSnapshot

		switch (edge) {
			case 0: {
				// Top
				const belowMax = y > bounds.maxY
				current.y = belowMax ? bounds.maxY : point.y
				current.height = Math.abs(point.y - bounds.maxY)

				for (let box of boxes) {
					snap = snapshots[box.id]
					box.height = snap.nh * current.height
					box.y = belowMax
						? bounds.maxY + (1 - snap.nmy) * current.height
						: y + snap.ny * current.height
				}

				break
			}
			case 1: {
				// Right
				const leftOfMin = x < bounds.x
				current.x = leftOfMin ? point.x : bounds.x
				current.width = Math.abs(point.x - bounds.x)

				for (let box of boxes) {
					snap = snapshots[box.id]
					box.width = snap.nw * current.width
					box.x = leftOfMin
						? x + (1 - snap.nmx) * current.width
						: bounds.x + snap.nx * current.width
				}

				break
			}
			case 2: {
				// Bottom
				const aboveMin = y < bounds.y
				current.y = aboveMin ? point.y : bounds.y
				current.height = Math.abs(point.y - bounds.y)

				for (let box of boxes) {
					snap = snapshots[box.id]
					box.height = snap.nh * current.height
					box.y = aboveMin
						? y + (1 - snap.nmy) * current.height
						: bounds.y + snap.ny * current.height
				}

				break
			}
			case 3: {
				// Left
				const rightOfMax = x > bounds.maxX
				current.x = rightOfMax ? bounds.maxX : point.x
				current.width = Math.abs(point.x - bounds.maxX)

				for (let box of boxes) {
					snap = snapshots[box.id]
					box.width = snap.nw * current.width
					box.x = rightOfMax
						? bounds.maxX + (1 - snap.nmx) * current.width
						: x + snap.nx * current.width
				}

				break
			}
		}

		current.maxX = current.x + current.width
		current.maxY = current.y + current.height
	}
}

export function getCornerResizer(boxes: IBox[], corner: number) {
	const bounds = getBoundingBox(boxes)

	const snapshots: Record<string, IBoxSnapshot> = Object.fromEntries(
		boxes.map((box) => [
			box.id,
			{
				...box,
				nx: (box.x - bounds.x) / bounds.width,
				ny: (box.y - bounds.y) / bounds.height,
				nmx: (box.x + box.width - bounds.x) / bounds.width,
				nmy: (box.y + box.height - bounds.y) / bounds.height,
				nw: box.width / bounds.width,
				nh: box.height / bounds.height,
			},
		])
	)

	return function cornerResize(
		boxes: IBox[],
		current: IBounds,
		point: IPointer
	) {
		const { x, y } = point
		let snap: IBoxSnapshot

		const leftOfMin = x < bounds.x
		const rightOfMax = x > bounds.maxX
		const aboveMin = y < bounds.y
		const belowMax = y > bounds.maxY

		switch (corner) {
			case 0: {
				// Top Left
				current.x = rightOfMax ? bounds.maxX : point.x
				current.y = belowMax ? bounds.maxY : point.y
				current.width = Math.abs(point.x - bounds.maxX)
				current.height = Math.abs(point.y - bounds.maxY)

				for (let box of boxes) {
					snap = snapshots[box.id]
					box.width = snap.nw * current.width
					box.x = rightOfMax
						? bounds.maxX + (1 - snap.nmx) * current.width
						: x + snap.nx * current.width
					box.height = snap.nh * current.height
					box.y = belowMax
						? bounds.maxY + (1 - snap.nmy) * current.height
						: y + snap.ny * current.height
				}

				break
			}
			case 1: {
				current.x = leftOfMin ? point.x : bounds.x
				current.y = belowMax ? bounds.maxY : point.y
				current.width = Math.abs(point.x - bounds.x)
				current.height = Math.abs(point.y - bounds.maxY)

				for (let box of boxes) {
					snap = snapshots[box.id]
					box.width = snap.nw * current.width
					box.x = leftOfMin
						? x + (1 - snap.nmx) * current.width
						: bounds.x + snap.nx * current.width
					box.height = snap.nh * current.height
					box.y = belowMax
						? bounds.maxY + (1 - snap.nmy) * current.height
						: y + snap.ny * current.height
				}

				break
			}
			case 2: {
				current.x = leftOfMin ? point.x : bounds.x
				current.y = aboveMin ? point.y : bounds.y
				current.width = Math.abs(point.x - bounds.x)
				current.height = Math.abs(point.y - bounds.y)

				for (let box of boxes) {
					snap = snapshots[box.id]
					box.width = snap.nw * current.width
					box.x = leftOfMin
						? x + (1 - snap.nmx) * current.width
						: bounds.x + snap.nx * current.width
					box.height = snap.nh * current.height
					box.y = aboveMin
						? y + (1 - snap.nmy) * current.height
						: bounds.y + snap.ny * current.height
				}

				break
			}
			case 3: {
				current.x = rightOfMax ? bounds.maxX : point.x
				current.y = aboveMin ? point.y : bounds.y
				current.width = Math.abs(point.x - bounds.maxX)
				current.height = Math.abs(point.y - bounds.y)

				for (let box of boxes) {
					snap = snapshots[box.id]
					box.width = snap.nw * current.width
					box.x = rightOfMax
						? bounds.maxX + (1 - snap.nmx) * current.width
						: x + snap.nx * current.width
					box.height = snap.nh * current.height
					box.y = aboveMin
						? y + (1 - snap.nmy) * current.height
						: bounds.y + snap.ny * current.height
				}

				break
			}
		}

		current.maxX = current.x + current.width
		current.maxY = current.y + current.height
	}
}

export type EdgeResizer = ReturnType<typeof getEdgeResizer>
export type CornerResizer = ReturnType<typeof getCornerResizer>
