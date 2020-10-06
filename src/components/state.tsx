import uniqueId from "lodash/uniqueId"
import sortBy from "lodash/sortBy"
import { createState } from "@state-designer/react"
import { ArrowOptions, getBoxToBoxArrow } from "perfect-arrows"
import { modulate } from "./arrows/utils"

export interface IPoint {
	x: number
	y: number
}

export interface ISize {
	width: number
	height: number
}

export interface IFrame extends IPoint, ISize {}

export interface IBox extends IFrame {
	id: string
	label: string
	color: string
	start: IFrame
}

export interface IArrow {
	id: string
	from: string
	to: string
	flip: boolean
	label: string
	points: number[]
}

const arrowOptions = {
	box: 0.05,
	stretchMax: 1200,
	padEnd: 12,
}

const tempBox: IBox = {
	id: "-2",
	x: 0,
	y: 0,
	width: 0,
	height: 0,
	label: "",
	color: "rgba(255, 255, 255, 1)",
	start: {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	},
}

// Offsets

const mouse = { x: 0, y: 0 }
const origin = { x: 0, y: 0 }
const scroll = { x: 2500, y: 2500 }
const scrollOrigin = { x: 2500, y: 2500 }
const viewport = { width: 0, height: 0 }
let scale = 1

// Key states

export const keyState = createState({
	initial: "none",
	states: {
		none: {
			on: {
				PRESSED_ALT: { to: "alt" },
				PRESSED_SHIFT: { to: "shift" },
				PRESSED_CONTROL: { to: "control" },
				PRESSED_META: { to: "meta" },
				PRESSED_SPACE: { to: "space" },
			},
		},
		shift: {
			on: {
				RELEASED_SHIFT: { to: "none" },
				PRESSED_ALT: { to: "shiftAlt" },
				PRESSED_META: { to: "shiftMeta" },
				PRESSED_CONTROL: { to: "shiftControl" },
			},
		},
		alt: {
			on: {
				RELEASED_ALT: { to: "none" },
				PRESSED_SHIFT: { to: "shiftAlt" },
			},
		},
		control: {
			on: {
				RELEASED_CONTROL: { to: "none" },
				PRESSED_SHIFT: { to: "shiftControl" },
			},
		},
		meta: {
			on: {
				RELEASED_META: { to: "none" },
				PRESSED_SHIFT: { to: "shiftMeta" },
			},
		},
		shiftAlt: {
			on: {
				RELEASED_SHIFT: { to: "alt" },
				RELEASED_ALT: { to: "shift" },
			},
		},
		shiftControl: {
			on: {
				RELEASED_SHIFT: { to: "control" },
				RELEASED_CONTROL: { to: "shift" },
			},
		},
		shiftMeta: {
			on: {
				RELEASED_SHIFT: { to: "meta" },
				RELEASED_META: { to: "shift" },
			},
		},
		space: {
			on: {
				RELEASED_SPACE: { to: "none" },
			},
		},
	},
	on: {
		PRESSED_ALT: "announceAltDown",
		PRESSED_SHIFT: "announceShiftDown",
		PRESSED_CONTROL: "announceControlDown",
		PRESSED_META: "announceMetaDown",
		PRESSED_SPACE: "announceSpaceDown",
		RELEASED_ALT: "announceAltUp",
		RELEASED_SHIFT: "announceShiftUp",
		RELEASED_CONTROL: "announceControlUp",
		RELEASED_META: "announceMetaUp",
		RELEASED_SPACE: "announceSpaceUp",
	},
	actions: {
		announceAltDown() {
			state.send("PRESSED_ALT")
		},
		announceMetaDown() {
			state.send("PRESSED_META")
		},
		announceControlDown() {
			state.send("PRESSED_CONTROL")
		},
		announceShiftDown() {
			state.send("PRESSED_SHIFT")
		},
		announceSpaceDown() {
			state.send("PRESSED_SPACE")
		},
		announceSpaceUp() {
			state.send("RELEASED_SPACE")
		},
		announceAltUp() {
			state.send("RELEASED_ALT")
		},
		announceMetaUp() {
			state.send("RELEASED_META")
		},
		announceControlUp() {
			state.send("RELEASED_CONTROL")
		},
		announceShiftUp() {
			state.send("RELEASED_SHIFT")
		},
	},
})

let curIndex = "1"
let prevIndex: any = localStorage.getItem("__index")
if (prevIndex === null) {
	curIndex = "1"
} else {
	const num = parseInt(JSON.parse(prevIndex), 10)
	curIndex = (num + 1).toString()
}

localStorage.setItem("__index", JSON.stringify(curIndex))

let initBoxes: IBox[]

// Previous BOxes

const prevBoxes = localStorage.getItem("__boxes")
if (prevBoxes === null) {
	initBoxes = [
		{
			id: "init0",
			x: 100,
			y: 100,
			width: 100,
			height: 100,
			label: "",
			color: "rgba(255, 255, 255, 1)",
			start: {
				x: 100,
				y: 100,
				width: 100,
				height: 100,
			},
		},
		{
			id: "init1",
			x: 200,
			y: 300,
			width: 100,
			height: 100,
			label: "",
			color: "rgba(255, 255, 255, 1)",
			start: {
				x: 200,
				y: 300,
				width: 100,
				height: 100,
			},
		},
	]
} else {
	initBoxes = JSON.parse(prevBoxes)
}

for (let box of initBoxes) {
	if (box.start === undefined) {
		box.start = {
			x: box.x,
			y: box.y,
			width: box.width,
			height: box.height,
		}
	}
}

// Arrows

let initArrows: IArrow[]

const prevArrows = localStorage.getItem("__arrows")
if (prevArrows === null) {
	const a = initBoxes[0]
	const b = initBoxes[1]
	initArrows = [
		{
			id: "initA0",
			from: "init0",
			to: "init1",
			flip: false,
			label: "",
			points: getArrow(a, b),
		},
	]
} else {
	initArrows = JSON.parse(prevArrows)
}

for (let arrow of initArrows) {
	if (arrow.points === undefined) {
		const a = initBoxes.find((box) => box.id === arrow.to)
		const b = initBoxes.find((box) => box.id === arrow.from)

		if (!(a && b)) {
			arrow.points = [0, 0, 0, 0, 0, 0, 0, 0, 0]
		} else {
			arrow.points = getArrow(a, b)
		}
	}
}

// STATE -------------------------------------------------

const state = createState({
	data: {
		selection: [] as string[],
		temp: tempBox,
		cloningBoxes: [] as IBox[],
		boxes: initBoxes,
		arrows: initArrows,
		arrow: {
			from: undefined as string | undefined,
			to: undefined as string | undefined,
		},
		drawing: {
			box: tempBox,
			brush: tempBox,
		},
		resizing: {
			corner: 0,
			edge: 0,
		},
		currentColor: "rgba(255, 255, 255, 1)",
	},
	onEnter: "updateAllArrows",
	on: {
		SELECTED_BOX_TOOL: { to: "drawing" },
		SELECTED_SELECT_TOOL: { to: "selecting" },
		UPDATED_VIEWPORT: { secretlyDo: "updateViewport" },
		SCROLLED: { secretlyDo: "updateScroll" },
		SCALED: { secretlyDo: "updateScale" },
		DOWNED_POINTER: { secretlyDo: "updateOrigin" },
		MOVED_POINTER: { secretlyDo: "updateMouse" },
		DRAGGED_POINTER: { secretlyDo: "updateMouse" },
		MOVED_BOX_DRAG: { secretlyDo: "updateMouse" },
		ALIGNED_LEFT: ["alignSelectedBoxesLeft", "updateArrowsToSelected"],
		ALIGNED_RIGHT: ["alignSelectedBoxesRight", "updateArrowsToSelected"],
		ALIGNED_CENTER_X: ["alignSelectedBoxesCenterX", "updateArrowsToSelected"],
		ALIGNED_TOP: ["alignSelectedBoxesTop", "updateArrowsToSelected"],
		ALIGNED_BOTTOM: ["alignSelectedBoxesBottom", "updateArrowsToSelected"],
		ALIGNED_CENTER_Y: ["alignSelectedBoxesCenterY", "updateArrowsToSelected"],
		DISTRIBUTED_X: ["distributeSelectedBoxesX", "updateArrowsToSelected"],
		DISTRIBUTED_Y: ["distributeSelectedBoxesY", "updateArrowsToSelected"],
		STRETCHED_X: ["stretchSelectedBoxesX", "updateArrowsToSelected"],
		STRETCHED_Y: ["stretchSelectedBoxesY", "updateArrowsToSelected"],
	},
	initial: "selecting",
	states: {
		selecting: {
			initial: "notSelecting",
			states: {
				notSelecting: {
					on: {
						CANCELLED: "clearSelection",
						PRESSED_SPACE: { to: "panning" },
						INVERTED_ARROWS: [
							"invertSelectedArrows",
							"invertSelectedBoxArrows",
						],
						FLIPPED_SELECTED_ARROW: [
							"flipSelectedArrows",
							"flipSelectedBoxArrows",
						],
						DELETED_SELECTION: {
							if: "hasSelection",
							do: ["deleteSelection", "clearSelection"],
							to: "notSelecting",
						},
						CHANGED_BOX_COLOR: {
							if: "boxSelected",
							do: ["setBoxColor", "setCurrentColor"],
						},
						CLICKED_ARROW: "selectArrow",
						STARTED_CLICKING_CANVAS: {
							to: "clickingCanvas",
						},
						STARTED_CLICKING_BOX: [
							{
								unless: "boxIsSelected",
								if: "isInShiftMode",
								do: "addBoxToSelection",
							},
							{
								to: "clickingBox",
							},
						],
						STARTED_CLICKING_BOUNDING_BOX: {
							to: "draggingBoundingBox",
						},
						STARTED_RESIZING: {
							do: ["selectBox", "updateBoxStarts", "setCorner"],
							to: "resizingBox",
						},
						STARTED_EDGE_RESIZING: {
							do: ["selectBox", "updateBoxStarts", "setEdge"],
							to: "edgeResizingBox",
						},
						STARTED_PICKING_ARROW: { do: "setArrowFrom", to: "pickingArrow" },
						STARTED_CLICKING_ARROW_NODE: {
							do: ["selectBox", "setArrowFrom"],
							to: "clickingArrowNode",
						},
						STARTED_EDITING_LABEL: {
							to: "editingLabel",
						},
						STARTED_EDITING_ARROW_LABEL: {
							to: "editingArrowLabel",
						},
					},
				},
				panning: {
					on: {
						RELEASED_SPACE: { to: "notSelecting" },
					},
				},
				clickingBox: {
					onEnter: "updateBoxStarts",
					on: {
						STOPPED_CLICKING_BOX: [
							{
								if: "isInShiftMode",
								then: {
									if: "boxIsSelected",
									do: "removeBoxFromSelection",
									else: "addBoxToSelection",
								},
								else: "selectBox",
							},
							{
								to: "notSelecting",
							},
						],
						MOVED_BOX_DRAG: [
							{
								unless: "boxIsSelected",
								do: "selectBox",
							},
							{
								to: "draggingSelectedBoxes",
							},
						],
					},
				},
				draggingBoundingBox: {
					onEnter: "updateBoxStarts",
					on: {
						MOVED_BOUNDING_BOX_DRAG: { to: "draggingSelectedBoxes" },
					},
				},
				clickingCanvas: {
					onEnter: "updateOrigin",
					on: {
						CANCELLED: { to: "notSelecting" },
						STOPPED_CLICKING_CANVAS: {
							do: "clearSelection",
							to: "notSelecting",
						},
						DRAGGED_POINTER: {
							to: "drawingBrush",
						},
					},
				},
				drawingBrush: {
					onEnter: "updateBrush",
					on: {
						CANCELLED: { to: "notSelecting" },
						DRAGGED_POINTER: {
							do: ["updateBrush", "updateBrushSelection"],
						},
						SCROLLED: {
							do: ["updateBrush", "updateBrushSelection"],
						},
						RAISED_POINTER: {
							to: "notSelecting",
						},
					},
				},
				clickingArrowNode: {
					on: {
						RAISED_POINTER: { to: "pickingArrow" },
						MOVED_POINTER: { to: "drawingArrow" },
					},
				},
				creatingArrow: {
					on: {
						ENTERED_BOX: {
							do: "setArrowTo",
						},
						EXITED_BOX: {
							do: "clearArrowTo",
						},
						MOVED_POINTER: "updateMouse",
						CANCELLED: { to: "notSelecting" },
					},
					initial: "pickingArrow",
					states: {
						pickingArrow: {
							on: {
								STARTED_CLICKING_CANVAS: {
									to: "notSelecting",
								},
								STARTED_CLICKING_BOX: {
									do: "completeArrow",
									to: "notSelecting",
								},
							},
						},
						drawingArrow: {
							on: {
								RAISED_POINTER: {
									do: "completeArrow",
									to: "notSelecting",
								},
							},
						},
					},
				},
				draggingSelectedBoxes: {
					onEnter: ["updateBoxStarts", "createCloningBoxes"],
					onExit: "clearCloningBoxes",
					initial: {
						if: "isInAltMode",
						to: "cloning",
						else: {
							to: "dragging",
						},
					},
					on: {
						MOVED_POINTER: {
							do: "updateCloningBox",
						},
						SCROLLED: {
							do: "updateCloningBox",
						},
						CANCELLED: {
							do: ["clearCloningBoxes", "moveDraggingBoxesToStart"],
							to: "notSelecting",
						},
					},
					states: {
						dragging: {
							onEnter: {
								do: "moveDraggingBoxesToClones",
							},
							on: {
								MOVED_POINTER: {
									do: ["updateDraggingBoxes", "updateArrowsToSelected"],
								},
								SCROLLED: {
									do: ["updateDraggingBoxes", "updateArrowsToSelected"],
								},
								PRESSED_SHIFT: {
									do: "snapDraggingBoxesToAxis",
								},
								PRESSED_ALT: {
									to: "cloning",
								},
								RAISED_POINTER: {
									to: "notSelecting",
								},
							},
						},
						cloning: {
							onEnter: [
								"createCloningBoxes",
								"moveDraggingBoxesToStart",
								"updateArrowsToSelected",
							],
							on: {
								MOVED_POINTER: {
									do: "updateCloningBox",
								},
								SCROLLED: {
									do: "updateCloningBox",
								},
								CANCELLED: {
									do: "clearCloningBoxes",
									to: "notSelecting",
								},
								PRESSED_SHIFT: {
									do: "snapCloningBoxesToAxis",
								},
								RELEASED_ALT: {
									to: "dragging",
								},
								RAISED_POINTER: {
									do: ["completeClones", "clearCloningBoxes"],
									to: "notSelecting",
								},
							},
						},
					},
				},
				edgeResizingBox: {
					on: {
						MOVED_POINTER: {
							do: ["updateEdgeResizingBox", "updateArrowsToSelected"],
						},
						SCROLLED: {
							do: ["updateEdgeResizingBox", "updateArrowsToSelected"],
						},
						RAISED_POINTER: {
							to: "notSelecting",
						},
					},
				},
				resizingBox: {
					on: {
						MOVED_POINTER: {
							do: ["updateResizingBox", "updateArrowsToSelected"],
						},
						SCROLLED: {
							do: ["updateResizingBox", "updateArrowsToSelected"],
						},
						RAISED_POINTER: {
							to: "notSelecting",
						},
					},
				},
				editingLabel: {
					on: {
						STOPPED_EDITING_LABEL: { do: "updateBoxLabel", to: "notSelecting" },
					},
				},
				editingArrowLabel: {
					on: {
						STOPPED_EDITING_ARROW_LABEL: {
							do: "updateArrowLabel",
							to: "notSelecting",
						},
					},
				},
			},
		},
		drawing: {
			initial: "notDrawing",
			states: {
				notDrawing: {
					on: {
						DRAGGED_POINTER: {
							do: "createDrawingBox",
							to: "drawingBox",
						},
					},
				},
				drawingBox: {
					on: {
						DRAGGED_POINTER: {
							do: "updateDrawingBox",
						},
						RAISED_POINTER: [
							"updateDrawingBox",
							{
								if: "boxIsValid",
								do: "completeBox",
								else: "clearSelection",
							},
							{
								to: "selecting",
							},
						],
					},
				},
			},
		},
	},
	conditions: {
		isInShiftMode() {
			return keyState.isIn("shift")
		},
		isInAltMode() {
			return keyState.isIn("alt")
		},
		arrowSelected(data) {
			return data.arrows.findIndex(({ id }) => data.selection.includes(id)) > -1
		},
		boxSelected(data) {
			return data.boxes.findIndex(({ id }) => data.selection.includes(id)) > -1
		},
		hasSelection(data) {
			return data.selection.length > 0
		},
		boxIsValid(data) {
			const { box } = data.drawing
			return box.width > 8 && box.height > 8
		},
		boxIsSelected(data, payload = {}) {
			const { id } = payload
			return data.selection.includes(id)
		},
		arrowIsSelected(data, payload = {}) {
			const { id } = payload
			return data.selection.includes(id)
		},
	},
	actions: {
		// Update Viewport (Secret!)
		updateViewport(_, payload = {}) {
			const { width, height } = payload
			viewport.width = width
			viewport.height = height
		},
		// Scale (Secret!)
		updateScale(_, payload = {}) {
			scale = payload.scale
		},
		// Scroll (Secret!)
		updateScroll(_, payload = {}) {
			const { x, y } = payload
			scroll.x = x
			scroll.y = y
		},
		// Mouse (Secret!)
		updateMouse(_, payload = {}) {
			const { x, y } = payload
			mouse.x = x
			mouse.y = y
		},
		// Origin (Secret!)
		updateOrigin(_, payload = {}) {
			const point = getPoint()
			origin.x = point.x
			origin.y = point.y
			scrollOrigin.x = scroll.x
			scrollOrigin.y = scroll.y
		},
		// Brush
		updateBrush(data) {
			const { brush } = data.drawing
			const { x, y, ox, oy } = getPoints()

			brush.x = Math.min(x, ox)
			brush.y = Math.min(y, oy)
			brush.width = Math.abs(x - ox)
			brush.height = Math.abs(y - oy)
		},
		updateBrushSelection(data) {
			const {
				drawing: { brush },
				boxes,
			} = data

			data.selection = boxes
				.filter(
					(box) =>
						!(
							brush.x > box.x + box.width ||
							brush.y > box.y + box.height ||
							brush.x + brush.width < box.x ||
							brush.y + brush.height < box.y
						)
				)
				.map((box) => box.id)
		},
		// Clone
		moveDraggingBoxesToClones(data) {
			const { boxes, selection, cloningBoxes } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))

			selectedBoxes.forEach((box, i) => {
				const clone = cloningBoxes[i]
				box.x = clone.x
				box.y = clone.y
			})
		},
		moveClonesDraggingBoxes(data) {
			const { boxes, selection, cloningBoxes } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))

			selectedBoxes.forEach((box, i) => {
				const clone = cloningBoxes[i]
				box.x = clone.x
				box.y = clone.y
			})
		},
		moveDraggingBoxesToStart(data) {
			const { boxes, selection } = data
			const index = data.boxes.findIndex((box) => box.id === selection[0])
			const box = boxes[index]

			box.x = box.start.x
			box.y = box.start.y
		},
		createCloningBoxes(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter(({ id }) => selection.includes(id))
			data.cloningBoxes = selectedBoxes.map((box) => ({
				...box,
				x: box.start.x,
				y: box.start.y,
				id: uniqueId(curIndex + "clone"),
			}))
		},
		updateCloningBox(data) {
			const { cloningBoxes } = data
			const { x, y, ox, oy } = getPoints()
			const isSnapped = keyState.isInAny("shift", "shiftAlt")

			for (let box of cloningBoxes) {
				box.x = box.start.x + (x - ox)
				box.y = box.start.y + (y - oy)

				if (isSnapped) {
					if (Math.abs(x - ox) > Math.abs(y - oy)) {
						// Lock changes to X Axis
						box.y = box.start.y
					} else {
						// Lock changes to Y axis
						box.x = box.start.x
					}
				}
			}
		},
		snapCloningBoxesToAxis(data) {
			const { cloningBoxes } = data
			const { x, y, ox, oy } = getPoints()
			const isSnapped = keyState.isInAny("shift", "shiftAlt")

			for (let box of cloningBoxes) {
				if (isSnapped) {
					if (Math.abs(x - ox) > Math.abs(y - oy)) {
						// Lock changes to X Axis
						box.y = box.start.y
					} else {
						// Lock changes to Y axis
						box.x = box.start.x
					}
				}
			}
		},
		completeClones(data) {
			const { cloningBoxes } = data

			const clonedBoxes = cloningBoxes.map((box) => ({
				...box,
				id: uniqueId(curIndex + "box"),
			}))

			data.selection = clonedBoxes.map((box) => box.id)

			data.boxes.push(...clonedBoxes)
		},
		clearCloningBoxes(data) {
			data.cloningBoxes = []
		},
		// Selection
		selectArrow(data, payload = {}) {
			const { id } = payload
			data.selection = [id]
		},
		addArrowToSelection(data, payload = {}) {
			const { id } = payload
			data.selection.push(id)
		},
		removeArrowFromSelection(data, payload = {}) {
			const { id } = payload
			const index = data.selection.indexOf(id)
			data.selection.splice(index, 1)
		},
		selectBox(data, payload = {}) {
			const { id } = payload
			data.selection = [id]
		},
		addBoxToSelection(data, payload = {}) {
			const { id } = payload
			data.selection.push(id)
		},
		removeBoxFromSelection(data, payload = {}) {
			const { id } = payload
			const index = data.selection.indexOf(id)
			data.selection.splice(index, 1)
		},
		clearSelection(data) {
			data.selection = []
		},
		deleteSelection(data) {
			const { arrows, boxes, selection } = data
			const selectedArrows = arrows.filter(({ id }) => selection.includes(id))
			const selectedBoxes = boxes.filter(({ id }) => selection.includes(id))

			for (let arrow of selectedArrows) {
				const index = arrows.indexOf(arrow)
				arrows.splice(index, 1)
			}

			for (let box of selectedBoxes) {
				arrows
					.filter((arrow) => arrow.to === box.id || arrow.from === box.id)
					.forEach(({ id }) => {
						const arrowIndex = arrows.findIndex((arrow) => arrow.id === id)
						data.arrows.splice(arrowIndex, 1)
					})

				const index = boxes.indexOf(box)
				data.boxes.splice(index, 1)
			}
		},
		// Arrows
		setArrowTo(data, payload = {}) {
			const { id = "-1" } = payload
			if (id === data.arrow.from) return
			data.arrow.to = id
		},
		setArrowFrom(data) {
			const { selection } = data
			data.arrow.from = selection[0]
		},

		completeArrow(data, payload = {}) {
			const { boxes, arrow } = data
			const { to, from } = arrow
			if (!(to && from)) return

			const a = boxes.find((box) => box.id === from)
			const b = boxes.find((box) => box.id === to)

			if (!(a && b)) return

			const id = uniqueId(curIndex + "arrow")

			data.arrows.push({
				id,
				to,
				from,
				label: "",
				flip: false,
				points: getArrow(a, b),
			})

			data.selection = [to]
			data.arrow.to = undefined
			data.arrow.from = undefined
		},
		updateAllArrows(data) {
			const { arrows, boxes } = data
			updateArrows(arrows, boxes)
		},
		updateArrowsToSelected(data) {
			const { arrows, boxes, selection } = data
			const connectedArrows = arrows.filter(
				(arrow) =>
					selection.includes(arrow.to) || selection.includes(arrow.from)
			)
			updateArrows(connectedArrows, boxes)
		},
		invertSelectedArrows(data) {
			const { boxes, arrows, selection } = data
			const selectedArrows = arrows.filter((arrow) =>
				selection.includes(arrow.id)
			)

			for (let arrow of selectedArrows) {
				const t = arrow.from
				arrow.from = arrow.to
				arrow.to = t
			}

			updateArrows(selectedArrows, boxes)
		},
		invertSelectedBoxArrows(data) {
			const { arrows, boxes, selection } = data
			const selectedArrows = arrows.filter(({ to, from }) =>
				[to, from].some((id) => selection.includes(id))
			)

			for (let arrow of selectedArrows) {
				const t = arrow.from
				arrow.from = arrow.to
				arrow.to = t
			}

			updateArrows(selectedArrows, boxes)
		},
		flipSelectedArrows(data) {
			const { boxes, arrows, selection } = data

			for (let arrow of arrows) {
				if (selection.includes(arrow.id)) {
					arrow.flip = !arrow.flip
				}
			}

			updateArrows(arrows, boxes)
		},
		flipSelectedBoxArrows(data) {
			const { arrows, boxes, selection } = data
			const connectedArrows = arrows.filter(({ to, from }) =>
				[to, from].some((id) => selection.includes(id))
			)
			for (let arrow of connectedArrows) {
				arrow.flip = !arrow.flip
			}

			updateArrows(connectedArrows, boxes)
		},
		clearArrowTo(data, payload = {}) {
			data.arrow.to = undefined
		},
		// Boxes
		updateBoxStarts(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))

			for (let box of selectedBoxes) {
				box.start = {
					x: box.x,
					y: box.y,
					width: box.width,
					height: box.height,
				}
			}
		},
		setCorner(data, payload = {}) {
			const { corner } = payload
			data.resizing.corner = corner
		},
		setEdge(data, payload = {}) {
			const { edge } = payload
			data.resizing.edge = edge
		},
		createDrawingBox(data) {
			const id = uniqueId(curIndex + "box")
			const { x, y } = getPoints()

			data.drawing.box = {
				id,
				x,
				y,
				width: 0,
				height: 0,
				label: "",
				color: data.currentColor,
				start: { x, y, width: 0, height: 0 },
			}
		},
		updateDrawingBox(data) {
			const {
				drawing: { box },
			} = data
			if (!box) return
			const { x, y, ox, oy } = getPoints()

			box.x = Math.min(x, ox)
			box.y = Math.min(y, oy)
			box.width = Math.abs(x - ox)
			box.height = Math.abs(y - oy)
		},
		// Dragging Box
		updateDraggingBoxes(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))
			const { x, y, ox, oy } = getPoints()
			const isSnapped = keyState.isInAny("shift")

			for (let box of selectedBoxes) {
				box.x = box.start.x + (x - ox)
				box.y = box.start.y + (y - oy)

				if (isSnapped) {
					if (Math.abs(x - ox) > Math.abs(y - oy)) {
						// Lock changes to X Axis
						box.y = box.start.y
					} else {
						// Lock changes to Y axis
						box.x = box.start.x
					}
				}
			}
		},
		snapDraggingBoxesToAxis(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))
			const { x, y, ox, oy } = getPoints()
			const isSnapped = keyState.isInAny("shift")

			for (let box of selectedBoxes) {
				if (isSnapped) {
					if (Math.abs(x - ox) > Math.abs(y - oy)) {
						// Lock changes to X Axis
						box.y = box.start.y
					} else {
						// Lock changes to Y axis
						box.x = box.start.x
					}
				}
			}
		},
		// Resizing
		updateEdgeResizingBox(data) {
			const {
				boxes,
				selection,
				resizing: { edge },
			} = data
			const index = boxes.findIndex((box) => box.id === selection[0])
			const box = boxes[index]
			if (!box) return

			const { x, y, ox, oy } = getPoints()

			const { x: sx, y: sy, height: sh, width: sw } = box.start
			const maxX = sx + sw
			const maxY = sy + sh
			const dx = x - ox
			const dy = y - oy

			if (y === box.y || x === box.x) return

			switch (edge) {
				case 0: {
					// y
					if (y < sy + sh) {
						box.y = sy + dy
						box.height = sh - dy
					} else {
						box.y = maxY
						box.height = y - maxY
					}
					break
				}
				case 1: {
					// maxX
					if (x < sx) {
						box.x = x
						box.width = sx - x
					} else {
						box.x = sx
						box.width = x - sx
					}
					break
				}
				case 2: {
					// maxY
					if (y < sy) {
						box.y = y
						box.height = sy - y
					} else {
						box.y = sy
						box.height = y - sy
					}
					break
				}
				case 3: {
					// x
					if (x < maxX) {
						box.x = sx + dx
						box.width = sw - dx
					} else {
						box.x = maxX
						box.width = x - maxX
					}
					break
				}
				default: {
				}
			}
		},
		updateResizingBox(data) {
			const {
				boxes,
				selection,
				resizing: { corner },
			} = data

			const index = boxes.findIndex((box) => box.id === selection[0])
			const box = boxes[index]

			const { x, y, ox, oy } = getPoints()

			const { x: sx, y: sy, height: sh, width: sw } = box.start
			const maxX = sx + sw
			const maxY = sy + sh
			const dx = x - ox
			const dy = y - oy

			if (y === box.y || x === box.x) return

			switch (corner) {
				case 0: {
					// x
					if (x < maxX) {
						box.x = sx + dx
						box.width = sw - dx
					} else {
						box.x = maxX
						box.width = x - maxX
					}

					// y
					if (y < sy + sh) {
						box.y = sy + dy
						box.height = sh - dy
					} else {
						box.y = maxY
						box.height = y - maxY
					}

					break
				}
				case 1: {
					// maxX
					if (x < sx) {
						box.x = x
						box.width = sx - x
					} else {
						box.x = sx
						box.width = x - sx
					}

					// y
					if (y < sy + sh) {
						box.y = sy + dy
						box.height = sh - dy
					} else {
						box.y = maxY
						box.height = y - maxY
					}

					break
				}
				case 2: {
					// maxX
					if (x < sx) {
						box.x = x
						box.width = sx - x
					} else {
						box.x = sx
						box.width = x - sx
					}

					// maxY
					if (y < sy) {
						box.y = y
						box.height = sy - y
					} else {
						box.y = sy
						box.height = y - sy
					}

					break
				}
				case 3: {
					// x
					if (x < maxX) {
						box.x = sx + dx
						box.width = sw - dx
					} else {
						box.x = maxX
						box.width = x - maxX
					}
					// maxY
					if (y < sy) {
						box.y = y
						box.height = sy - y
					} else {
						box.y = sy
						box.height = y - sy
					}

					break
				}
				default: {
				}
			}
		},
		updateBoxLabel(data, payload = {}) {
			const { value = "", id } = payload
			const { boxes } = data

			const box = boxes.find((box) => box.id === id)
			if (!box) return

			box.label = value
		},
		updateArrowLabel(data, payload = {}) {
			const { value = "", id } = payload
			const { arrows } = data

			const arrow = arrows.find((arrow) => arrow.id === id)
			if (!arrow) return

			arrow.label = value
		},
		completeBox(data) {
			const { box } = data.drawing
			if (!box) return

			data.selection = [box.id]

			data.boxes.push({ ...box })
		},
		setBoxColor(data, payload = {}) {
			const { color } = payload
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))

			for (let box of selectedBoxes) {
				box.color = color
			}
		},
		setCurrentColor(data, payload = {}) {
			const { color } = payload
			data.currentColor = color
		},
		// Alignment
		alignSelectedBoxesLeft(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))
			const [first, ...rest] = selectedBoxes
			let x = first.x
			for (let box of rest) if (box.x < x) x = box.x
			for (let box of selectedBoxes) box.x = x
		},
		alignSelectedBoxesRight(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))
			const [first, ...rest] = selectedBoxes
			let maxX = first.x + first.width
			for (let box of rest)
				if (box.x + box.width > maxX) maxX = box.x + box.width
			for (let box of selectedBoxes) box.x = maxX - box.width
		},
		alignSelectedBoxesCenterX(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))
			let midX = 0
			for (let box of selectedBoxes) {
				midX += box.x + box.width / 2
			}
			midX /= selectedBoxes.length
			for (let box of selectedBoxes) box.x = midX - box.width / 2
		},
		alignSelectedBoxesTop(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))
			const [first, ...rest] = selectedBoxes
			let y = first.y
			for (let box of rest) if (box.y < y) y = box.y
			for (let box of selectedBoxes) box.y = y
		},
		alignSelectedBoxesBottom(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))
			const [first, ...rest] = selectedBoxes
			let maxY = first.y + first.height
			for (let box of rest)
				if (box.y + box.height > maxY) maxY = box.y + box.height
			for (let box of selectedBoxes) box.y = maxY - box.height
		},
		alignSelectedBoxesCenterY(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))
			let midY = 0
			for (let box of selectedBoxes) {
				midY += box.y + box.height / 2
			}
			midY /= selectedBoxes.length
			for (let box of selectedBoxes) box.y = midY - box.height / 2
		},
		distributeSelectedBoxesX(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))

			const [first, ...rest] = selectedBoxes
			let min = first.x
			let max = first.x + first.width
			let sum = first.width

			for (let box of rest) {
				min = Math.min(min, box.x)
				max = Math.max(max, box.x + box.width)
				sum += box.width
			}

			let t = min
			const gap = (max - min - sum) / (selectedBoxes.length - 1)
			for (let box of sortBy(selectedBoxes, "x")) {
				box.x = t
				t += box.width + gap
			}
		},
		distributeSelectedBoxesY(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))

			const [first, ...rest] = selectedBoxes
			let min = first.y
			let max = first.y + first.height
			let sum = first.height

			for (let box of rest) {
				min = Math.min(min, box.y)
				max = Math.max(max, box.y + box.height)
				sum += box.height
			}

			let t = min
			const gap = (max - min - sum) / (selectedBoxes.length - 1)
			for (let box of sortBy(selectedBoxes, "y")) {
				box.y = t
				t += box.height + gap
			}
		},
		stretchSelectedBoxesX(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))
			const [first, ...rest] = selectedBoxes
			let min = first.x
			let max = first.x + first.width
			for (let box of rest) {
				min = Math.min(min, box.x)
				max = Math.max(max, box.x + box.width)
			}
			for (let box of selectedBoxes) {
				box.x = min
				box.width = max - min
			}
		},
		stretchSelectedBoxesY(data) {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter((box) => selection.includes(box.id))
			const [first, ...rest] = selectedBoxes
			let min = first.y
			let max = first.y + first.height
			for (let box of rest) {
				min = Math.min(min, box.y)
				max = Math.max(max, box.y + box.height)
			}
			for (let box of selectedBoxes) {
				box.y = min
				box.height = max - min
			}
		},
	},
	values: {
		drawingArrow(data) {
			const { arrow } = data
			const { to, from } = arrow
			const a = data.boxes.find((box) => box.id === from)
			const b = data.boxes.find((box) => box.id === to)

			const { x, y } = getPoints()

			let points: number[]

			if (a && !b) {
				points = getBoxToBoxArrow(
					a.x,
					a.y,
					a.width,
					a.height,
					x - 4,
					y - 4,
					8,
					8,
					arrowOptions
				)
			} else if (a && b) {
				points = getBoxToBoxArrow(
					a.x,
					a.y,
					a.width,
					a.height,
					b.x,
					b.y,
					b.width,
					b.height,
					arrowOptions
				)
			} else {
				return undefined
			}

			return points
		},
		selectedArrows(data): IArrow[] {
			const { arrows, selection } = data
			return arrows.filter(({ id }) => selection.includes(id))
		},
		selectedBoxes(data): IBox[] {
			const { boxes, selection } = data
			return boxes.filter(({ id }) => selection.includes(id))
		},
		boundingBox(data): IFrame | undefined {
			const { boxes, selection } = data
			const selectedBoxes = boxes.filter(({ id }) => selection.includes(id))
			if (selectedBoxes.length === 0) {
				return undefined
			}

			const [first, ...rest] = selectedBoxes

			const bounds = {
				x: first.x,
				y: first.y,
				maxX: first.x + first.width,
				maxY: first.y + first.height,
			}

			for (let box of rest) {
				if (box.x < bounds.x) bounds.x = box.x
				if (box.y < bounds.y) bounds.y = box.y
				if (box.x + box.width > bounds.maxX) bounds.maxX = box.x + box.width
				if (box.y + box.height > bounds.maxY) bounds.maxY = box.y + box.height
			}

			return {
				x: bounds.x,
				y: bounds.y,
				width: bounds.maxX - bounds.x,
				height: bounds.maxY - bounds.y,
			}
		},
	},
})

const undos = []
const redos = []

state.onUpdate(({ data }) => {
	const json = JSON.stringify(data)
	undos.push(json)
	// console.log(state.active)
	localStorage.setItem("__boxes", JSON.stringify(data.boxes))
	localStorage.setItem("__arrows", JSON.stringify(data.arrows))
})

export default state

function updateArrows(arrows: IArrow[], boxes: IBox[]) {
	const cache = {} as { [key: string]: IBox }

	for (let arrow of arrows) {
		const { to, from } = arrow
		const a = cache[from] || boxes.find((box) => box.id === from)
		const b = cache[to] || boxes.find((box) => box.id === to)

		if (!(a && b)) {
			continue
		}

		cache[from] = a
		cache[to] = b

		arrow.points = getArrow(a, b, { flip: arrow.flip })
	}
}

function getArrow(a: IBox, b: IBox, options: Partial<ArrowOptions> = {}) {
	const opts = { ...arrowOptions, ...options }
	return getBoxToBoxArrow(
		a.x,
		a.y,
		a.width,
		a.height,
		b.x,
		b.y,
		b.width,
		b.height,
		opts
	)
}

function getPoints() {
	const { x, y } = getPoint()
	const ox = origin.x
	const oy = origin.y

	return { x, y, ox, oy }
}

function getPoint() {
	const vw = viewport.width
	const vh = viewport.height

	const mx = vw / 2 + (mouse.x - vw / 2) / scale
	const my = vh / 2 + (mouse.y - vh / 2) / scale

	return {
		x: scroll.x + mx,
		y: scroll.y + my,
	}
}
