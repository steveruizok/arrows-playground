import without from "lodash/without"
import { createState } from "@state-designer/react"
import { IPoint, IBox, IArrow, IBounds } from "../types"
import { getInitialData } from "../components/utils"

const undos = []
const redos = []

/**
 * Store - the important stuff
 * Manages boxes, arrows, and selection.
 * Also handles undo / redo.
 */
const store = createState({
	data: {
		...getInitialData(),
		selection: [] as string[],
	},
	on: {
		CREATED_BOXES: ["createBoxes", "saveUndoState"],
		DELETED_BOXES: ["deleteBoxes", "saveUndoState"],
		MOVED_BOXES: ["moveBoxes", "saveUndoState"],
		UPDATED_BOXES: ["updateBoxes", "saveUndoState"],
		UPDATED_BOXES_SOFT: "updateBoxes",
		CREATED_ARROWS: ["createArrows", "saveUndoState"],
		DELETED_ARROWS: ["deleteArrows", "saveUndoState"],
		UPDATED_ARROWS: ["updateArrows", "saveUndoState"],
		UPDATED_ARROWS_SOFT: "updateArrows",
		UNDO: "loadUndoState",
		redo: "loadRedoState",
	},
	actions: {
		// BOXES
		createBoxes(data, payload = {}) {
			const { boxes = [] } = payload
			for (let box of boxes) {
				data.boxes[box.id] = box
			}
		},
		deleteBoxes(data, payload = {}) {
			const { ids = [] } = payload
			for (let id of ids) {
				delete data.boxes[id]
			}
		},
		moveBoxes(data, payload = {}) {
			const { boxes } = data
			const { ids = [], delta } = payload

			for (let id of ids) {
				const box = boxes[id]
				box.x += delta.x
				box.y += delta.y
			}
		},
		updateBoxes(data, payload = {}) {
			const { ids = [] } = payload
			for (let id of ids) {
				Object.assign(data.boxes[id], payload.update)
			}
		},
		// ARROWS
		createArrows(data, payload = {}) {
			const { arrows = [] } = payload
			for (let arrow of arrows) {
				data.arrows[arrow.id] = arrow
			}
		},
		deleteArrows(data, payload = {}) {
			const { ids = [] } = payload
			for (let id of ids) {
				delete data.arrows[id]
			}
		},
		updateArrows(data, payload = {}) {
			const { ids = [] } = payload
			for (let id of ids) {
				Object.assign(data.arrows[id], payload.update)
			}
		},
		// SELECTION
		setSelection(data, payload = {}) {
			const { ids = [] } = payload
			data.selection = ids
		},
		pushToSelection(data, payload = {}) {
			const { selection } = data
			const { ids = [] } = payload
			selection.push(ids)
		},
		pullFromSelection(data, payload = {}) {
			const { selection } = data
			const { ids = [] } = payload
			data.selection = without(selection, ids)
		},
		// UNDO / REDO
		saveUndoState(data: any) {
			undos.push(
				JSON.stringify({
					boxes: { ...data.boxes },
					arrows: { ...data.arrows },
				})
			)
		},
		loadUndoState(data) {
			redos.push(JSON.stringify({ ...data }))
			const undo = undos.pop()
			const json = JSON.parse(undo)
			Object.assign(data, json)
			redos.length = 0
		},
		loadRedoState(data) {
			const redo = undos.pop()
			if (!redo) return

			const json = JSON.parse(redo)
			Object.assign(data, json)
		},
	},
	values: {
		selectedBoxes(data) {
			return data.selection.map((id) => data.boxes[id]).filter(Boolean)
		},
		selectedArrows(data) {
			return data.selection.map((id) => data.arrows[id]).filter(Boolean)
		},
		boundingBox(data): IBounds {
			const selectedBoxes = data.selection
				.map((id) => data.boxes[id])
				.filter(Boolean)

			if (selectedBoxes.length === 0) {
				return undefined
			}

			const [first, ...rest] = selectedBoxes

			let x = first.x
			let maxX = first.x + first.width
			let y = first.y
			let maxY = first.y + first.height

			for (let box of rest) {
				x = Math.min(x, box.x)
				maxX = Math.max(maxX, box.x + box.width)
				y = Math.min(y, box.y)
				maxY = Math.max(maxY, box.y + box.height)
			}

			return {
				x,
				y,
				width: maxX - x,
				height: maxY - y,
				maxX,
				maxY,
			}
		},
	},
})

// ------------- Helpers

store.onUpdate(({ data }) => {
	// console.log(state.active)
	// localStorage.setItem("__2_boxes", JSON.stringify(data.boxes))
	// localStorage.setItem("__2_arrows", JSON.stringify(data.arrows))
})

export default store
