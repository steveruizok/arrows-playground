import { createState, createDesign } from "@state-designer/react"
import { IBox, IFrame, IArrow, IBoxSnapshot } from "../types"
import store from "./store"

let scale = 1
const pressedKeys = {} as Record<string, boolean>
const pointer = { x: 0, y: 0 }
const origin = { x: 0, y: 0 }
const scroll = { x: 2500, y: 2500 }
const scrollOrigin = { x: 2500, y: 2500 }
const viewport = { width: 0, height: 0 }

const design = createDesign({
	data: {
		spawning: {
			boxes: {} as Record<string, IBox>,
			arrows: {} as Record<string, IArrow>,
			clones: {} as Record<string, IBox>,
		},
		selecting: {
			brush: {} as IFrame,
			boxes: {} as Record<string, IBox>,
			arrows: {} as Record<string, IArrow>,
		},
		initial: {
			boxes: {} as Record<string, IBoxSnapshot>,
		},
	},
	on: {},
	initial: "selecting",
	states: {
		selecting: {
			initial: "selectingIdle",
			states: {
				selectingIdle: {
					on: {
						CANCELLED: { do: "clearSelection" },
						STARTED_CLICKING_BOX: { to: "clickingBox" },
						STARTED_CLICKING_CANVAS: { to: "brushSelecting" },
					},
				},
				clickingBox: {
					onEnter: "setInitialSnapshot",
					on: {
						DRAGGED_BOX: { if: "dragIsFarEnough", to: "draggingBox" },
					},
				},
				clickingArrowNode: {
					on: {
						DRAGGED_ARROW_NODE: { if: "dragIsFarEnough", to: "drawingArrow" },
						RELEASED_ARROW_NODE: { to: "pickingArrow" },
					},
				},
				brushSelecting: {
					on: {
						MOVED_POINTER: { do: "updateSelectionBrush" },
						SCROLLED: { do: "updateSelectionBrush" },
						RAISED_POINTER: { do: "completeSelection" },
					},
					initial: "settingSelection",
					states: {
						settingSelection: {
							on: {
								MOVED_POINTER: {
									get: "brushSelectedBoxes",
									do: "setBrushSelectedToSelection",
								},
								SCROLLED: {
									get: "brushSelectedBoxes",
									do: "setBrushSelectedToSelection",
								},
							},
						},
						pushingToSelection: {
							on: {
								MOVED_POINTER: {
									get: "brushSelectedBoxes",
									do: "pushBrushSelectedToSelection",
								},
								SCROLLED: {
									get: "brushSelectedBoxes",
									do: "pushBrushSelectedToSelection",
								},
							},
						},
					},
				},
				draggingBoxes: {
					states: {
						dragOperation: {
							initial: "notCloning",
							states: {
								notCloning: {
									onEnter: "clearDraggingBoxesClones",
									on: {
										ENTERED_OPTION_MODE: { to: "cloning" },
										RAISED_POINTER: { do: "completeSelectedBoxes" },
										CANCELLED: {
											do: "restoreInitialBoxes",
											to: "selectingIdle",
										},
									},
								},
								cloning: {
									onEnter: "createDraggingBoxesClones",
									on: {
										ENTERED_OPTION_MODE: { to: "notCloning" },
										RAISED_POINTER: {
											do: ["completeSelectedBoxes", "completeBoxesFromClones"],
										},
										CANCELLED: {
											do: ["restoreInitialBoxes", "clearDraggingBoxesClones"],
											to: "selectingIdle",
										},
									},
								},
							},
						},
						axes: {
							initial: "freeAxes",
							states: {
								freeAxes: {
									onEnter: "updateDraggingBoxesToLockedAxes",
									on: {
										ENTERED_SHIFT_MODE: { to: "lockedAxes" },
									},
								},
								lockedAxes: {
									onEnter: "updateDraggingBoxesToFreeAxes",
									on: {
										EXITED_SHIFT_MODE: { to: "freeAxes" },
									},
								},
							},
						},
					},
				},
				resizingBoxes: {
					on: {
						CANCELLED: { do: "restoreInitialBoxes", to: "selectingIdle" },
						RAISED_POINTER: { do: "completeSelectedBoxes" },
					},
					initial: "edgeResizing",
					states: {
						edgeResizing: {
							on: {
								MOVED_POINTER: { do: "cornerResizeSelectedBoxes" },
								SCROLLED: { do: "cornerResizeSelectedBoxes" },
							},
						},
						cornerResizing: {
							on: {
								MOVED_POINTER: { do: "edgeResizeSelectedBoxes" },
								SCROLLED: { do: "edgeResizeSelectedBoxes" },
							},
							initial: "freeRatio",
							states: {
								freeRatio: {
									onEnter: "updateResizingBoxesToLockedRatio",
									on: {
										ENTERED_SHIFT_MODE: { to: "lockedRatio" },
									},
								},
								lockedRatio: {
									onEnter: "updateResizingBoxesToFreeRatio",
									on: {
										EXITED_SHIFT_MODE: { to: "freeRatio" },
									},
								},
							},
						},
					},
				},
				creatingArrow: {
					initial: "drawingArrow",
					on: 
					states: {
						drawingArrow: {},
						pickingArrow: {},
					},
				},
			},
		},
		drawingBox: {
			on: {
				CANCELLED: { to: "selecting" },
			},
			initial: "notDrawing",
			states: {
				notDrawing: {},
			},
		},
		pickingArrow: {
			initial: "choosingFrom",
			on: {
				CANCELLED: { to: "selecting" },
			},
			states: {
				choosingFrom: {},
				choosingTo: {},
			},
		},
	},
	results: {
		brushSelectedBoxes() {},
	},
	conditions: {
		dragIsFarEnough() {
			return true
		},
	},
	actions: {
		// Selection
		clearSelection() {},
		completeSelection() {},
		updateSelectionBrush() {},
		setBrushSelectedToSelection() {},
		pushBrushSelectedToSelection() {},
		setInitialSnapshot() {},
		// Drawing Arrow
		createDrawingArrow() {},
		setDrawingArrowTarget() {},
		completeDrawingArrow() {},
		clearDrawingArrow() {},
		// Arrows
		updateSelectedArrows() {},
		flipSelectedArrows() {},
		invertSelectedArrows() {},
		// Arrows to Boxes
		updateArrowsToSelectedBoxes() {},
		flipArrowsToSelectedBoxes() {},
		invertArrowsToSelectedBoxes() {},
		// Drawing Box
		createDrawingBox() {},
		updateDrawingBox() {},
		completeDrawingBox() {},
		clearDrawingBox() {},
		// Boxes
		dragSelectedBoxes() {},
		edgeResizeSelectedBoxes() {},
		cornerResizeSelectedBoxes() {},
		updateResizingBoxesToFreeRatio() {},
		updateResizingBoxesToLockedRatio() {},
		updateDraggingBoxesToFreeAxes() {},
		updateDraggingBoxesToLockedAxes() {},
		restoreInitialBoxes() {},
		completeSelectedBoxes() {},
		// Clones
		clearDraggingBoxesClones() {},
		createDraggingBoxesClones() {},
		completeBoxesFromClones() {},
	},
	values: {},
})

const state = createState(design)

export default state

// Key Presses (not part of state chart, but still may cause events)

const keyDownActions = {
	Escape: "CANCELLED",
	Alt: "ENTERED_ALT_MODE",
	" ": "ENTERED_SPACE_MODE",
	Shift: "ENTERED_SHIFT_MODE",
	Control: "ENTERED_CONTROL_MODE",
	Meta: "ENTERED_META_MODE",
}

const keyUpActions = {
	Alt: "EXITED_ALT_MODE",
	" ": "EXITED_SPACE_MODE",
	Shift: "EXITED_SHIFT_MODE",
	Control: "EXITED_CONTROL_MODE",
	Meta: "EXITED_META_MODE",
	f: "SELECTED_DRAWING",
	v: "SELECTED_SELECTING",
}

export function handleKeyDown(e: KeyboardEvent) {
	pressedKeys[e.key] = true
	const action = keyDownActions[e.key]
	if (action) {
		state.send(action)
	}
	// Handle shift here?
}

export function handleKeyUp(e: KeyboardEvent) {
	pressedKeys[e.key] = false
	const action = keyUpActions[e.key]
	if (action) {
		state.send(action)
	}
}

export function handleKeyPress(e: KeyboardEvent) {
	if (e.key === " " && !state.isInAny("editingLabel", "editingArrowLabel")) {
		e.preventDefault()
	}
}

export function handlePointerMove(e: PointerEvent) {
	pointer.x = e.pageX
	pointer.y = e.pageY
}

export function handlePointerDown(e: PointerEvent) {
	origin.x = pointer.x
	origin.y = pointer.y
	scrollOrigin.x = scroll.x
	scrollOrigin.y = scroll.y
}

export function handleScroll(left: number, top: number) {
	scroll.x = left
	scroll.y = top
	state.send("SCROLLED")
	state.send("MOVED_POINTER") // TODO: Combine in the state machine.
}

export function handleViewportChange(width: number, height: number) {
	viewport.width = width
	viewport.height = height
	state.send("CHANGED_VIEWPORT")
}

export function handleScaleChange(value: number) {
	scale = value
	state.send("SCALED")
	state.send("MOVED_POINTER") // TODO: Combine in the state machine.
}
