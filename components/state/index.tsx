import { createState } from "@state-designer/react"
import {
  IPoint,
  IBounds,
  IBrush,
  IBox,
  IFrame,
  IArrow,
  IBoxSnapshot,
} from "../../types"
import {
  pressedKeys,
  viewBoxToCamera,
  getBoundingBox,
  getInitialData,
} from "./utils"
import * as BoxTransforms from "./box-transforms"
import clamp from "lodash/clamp"

let resizer: BoxTransforms.EdgeResizer | BoxTransforms.CornerResizer

const undos = []
const redos = []

export const pointerState = createState({
  data: { screen: { x: 0, y: 0 }, document: { x: 0, y: 0 } },
  on: { MOVED_POINTER: (d, p) => Object.assign(d, p) },
})

const state = createState({
  data: {
    ...getInitialData(),
    pointer: {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
    },
    camera: {
      x: 0,
      y: 0,
      zoom: 1,
    },
    viewBox: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      scrollX: 0,
      scrollY: 0,
    },
    spawning: {
      boxes: {} as Record<string, IBox>,
      arrows: {} as Record<string, IArrow>,
      clones: {} as Record<string, IBox>,
    },
    brush: undefined as IBrush | undefined,
    bounds: undefined as IBounds | undefined,
    initial: {
      pointer: { x: 0, y: 0 },
      selected: {
        boxIds: [] as string[],
        arrowIds: [] as string[],
      },
      boxes: {} as Record<string, IBoxSnapshot>,
    },
  },
  on: {
    UNDO: "loadUndoState",
    REDO: "loadRedoState",
    STARTED_POINTING: { secretlyDo: "setInitialPointer" },
    MOVED_POINTER: { secretlyDo: "updatePointerOnPointerMove" },
    ZOOMED: "updateCameraZoom",
    PANNED: ["updateCameraPoint", "updatePointerOnPan"],
    SCROLLED_VIEWPORT: "updateViewBoxOnScroll",
    UPDATED_VIEWBOX: ["updateCameraOnViewBoxChange", "updateViewBox"],
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        STARTED_POINTING_BOUNDS_EDGE: { to: "edgeResizing" },
        STARTED_POINTING_BOUNDS_CORNER: { to: "cornerResizing" },
        STARTED_POINTING_CANVAS: { to: "pointingCanvas" },
        STARTED_POINTING_BOX: [
          { unless: "boxIsSelected", do: ["selectBox", "updateBounds"] },
          { to: "dragging" },
        ],
        STARTED_DRAGGING_BOUNDS: { to: "dragging" },
      },
    },
    pointingCanvas: {
      on: {
        MOVED_POINTER: { if: "distanceIsFarEnough", to: "brushSelecting" },
        STOPPED_POINTING_CANVAS: {
          do: ["clearSelection", "updateBounds"],
          to: "idle",
        },
      },
    },
    brushSelecting: {
      onEnter: ["startBrush", "setInitialSelectedIds"],
      on: {
        MOVED_POINTER: [
          "moveBrush",
          {
            get: "brushSelectingBoxes",
            if: "selectionHasChanged",
            do: ["setSelectedIds", "updateBounds"],
          },
        ],
        STOPPED_POINTING: { do: "completeBrush", to: "idle" },
      },
    },
    dragging: {
      states: {
        dragIdle: {
          onEnter: ["setInitialPointer", "setInitialSnapshot"],
          on: {
            MOVED_POINTER: {
              do: ["moveDraggingBoxes", "moveBounds"],
              to: "dragActive",
            },
            STOPPED_POINTING: { to: "idle" },
          },
        },
        dragActive: {
          on: {
            MOVED_POINTER: ["moveDraggingBoxes", "moveBounds"],
            STOPPED_POINTING: {
              do: ["updateBounds", "saveUndoState"],
              to: "idle",
            },
          },
        },
      },
    },
    edgeResizing: {
      initial: "edgeResizeIdle",
      states: {
        edgeResizeIdle: {
          onEnter: "setEdgeResizer",
          on: {
            MOVED_POINTER: { do: "resizeBounds", to: "edgeResizeActive" },
            STOPPED_POINTING: { to: "idle" },
          },
        },
        edgeResizeActive: {
          on: {
            MOVED_POINTER: { do: "resizeBounds" },
            STOPPED_POINTING: { do: "saveUndoState", to: "idle" },
          },
        },
      },
    },
    cornerResizing: {
      initial: "cornerResizeIdle",
      states: {
        cornerResizeIdle: {
          onEnter: "setCornerResizer",
          on: {
            MOVED_POINTER: {
              do: "resizeBounds",
              to: "cornerResizeActive",
            },
            STOPPED_POINTING: { to: "idle" },
          },
        },
        cornerResizeActive: {
          on: {
            MOVED_POINTER: { do: "resizeBounds" },
            STOPPED_POINTING: { do: "saveUndoState", to: "idle" },
          },
        },
      },
    },

    // selected: {
    //   on: {
    //     DOWNED_POINTER: { do: "updateOrigin" },
    //   },
    //   initial: "selectedIdle",
    //   states: {
    //     selectedIdle: {
    //       on: {
    //         CANCELLED: { do: "clearSelection" },
    //         STARTED_CLICKING_BOX: { to: "clickingBox" },
    //         STARTED_CLICKING_CANVAS: { to: "clickingCanvas" },
    //       },
    //     },
    //     clickingCanvas: {
    //       on: {
    //         STOPPED_CLICKING_CANVAS: {
    //           do: "clearSelection",
    //           to: "selectedIdle",
    //         },
    //         MOVED_POINTER: { if: "dragIsFarEnough", to: "brushSelecting" },
    //       },
    //     },
    //     clickingBox: {
    //       onEnter: "setInitialSnapshot",
    //       on: {
    //         DRAGGED_BOX: { if: "dragIsFarEnough", to: "draggingBox" },
    //       },
    //     },
    //     clickingArrowNode: {
    //       on: {
    //         DRAGGED_ARROW_NODE: { if: "dragIsFarEnough", to: "drawingArrow" },
    //         RELEASED_ARROW_NODE: { to: "pickingArrow" },
    //       },
    //     },
    //     brushSelecting: {
    //       onEnter: [
    //         "setInitialSelection",
    //         "updateSelectionBrush",
    //         {
    //           if: "isInShiftMode",
    //           to: "pushingToSelection",
    //           else: { to: "settingSelection" },
    //         },
    //       ],
    //       on: {
    //         MOVED_POINTER: { do: "updateSelectionBrush" },
    //         SCROLLED: { do: "updateSelectionBrush" },
    //         RAISED_POINTER: { do: "completeSelection", to: "selectedIdle" },
    //       },
    //       initial: "settingSelection",
    //       states: {
    //         settingSelection: {
    //           onEnter: {
    //             get: "brushSelectingBoxes",
    //             do: "setbrushSelectingToSelection",
    //           },
    //           on: {
    //             ENTERED_SHIFT_MODE: { to: "pushingToSelection" },
    //             MOVED_POINTER: {
    //               get: "brushSelectingBoxes",
    //               if: "brushSelectionHasChanged",
    //               do: "setbrushSelectingToSelection",
    //             },
    //             SCROLLED: {
    //               get: "brushSelectingBoxes",
    //               if: "brushSelectionHasChanged",
    //               do: "setbrushSelectingToSelection",
    //             },
    //           },
    //         },
    //         pushingToSelection: {
    //           onEnter: {
    //             get: "brushSelectingBoxes",
    //             do: "pushbrushSelectingToSelection",
    //           },
    //           on: {
    //             EXITED_SHIFT_MODE: { to: "settingSelection" },
    //             MOVED_POINTER: {
    //               get: "brushSelectingBoxes",
    //               do: "pushbrushSelectingToSelection",
    //             },
    //             SCROLLED: {
    //               get: "brushSelectingBoxes",
    //               do: "pushbrushSelectingToSelection",
    //             },
    //           },
    //         },
    //       },
    //     },
    //     draggingBoxes: {
    //       states: {
    //         dragOperation: {
    //           initial: "notCloning",
    //           states: {
    //             notCloning: {
    //               onEnter: "clearDraggingBoxesClones",
    //               on: {
    //                 ENTERED_OPTION_MODE: { to: "cloning" },
    //                 RAISED_POINTER: { do: "completeSelectedBoxes" },
    //                 CANCELLED: {
    //                   do: "restoreInitialBoxes",
    //                   to: "selectedIdle",
    //                 },
    //               },
    //             },
    //             cloning: {
    //               onEnter: "createDraggingBoxesClones",
    //               on: {
    //                 ENTERED_OPTION_MODE: { to: "notCloning" },
    //                 RAISED_POINTER: {
    //                   do: ["completeSelectedBoxes", "completeBoxesFromClones"],
    //                 },
    //                 CANCELLED: {
    //                   do: ["restoreInitialBoxes", "clearDraggingBoxesClones"],
    //                   to: "selectedIdle",
    //                 },
    //               },
    //             },
    //           },
    //         },
    //         axes: {
    //           initial: "freeAxes",
    //           states: {
    //             freeAxes: {
    //               onEnter: "updateDraggingBoxesToLockedAxes",
    //               on: {
    //                 ENTERED_SHIFT_MODE: { to: "lockedAxes" },
    //               },
    //             },
    //             lockedAxes: {
    //               onEnter: "updateDraggingBoxesToFreeAxes",
    //               on: {
    //                 EXITED_SHIFT_MODE: { to: "freeAxes" },
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //     resizingBoxes: {
    //       on: {
    //         CANCELLED: { do: "restoreInitialBoxes", to: "selectedIdle" },
    //         RAISED_POINTER: { do: "completeSelectedBoxes" },
    //       },
    //       initial: "edgeResizing",
    //       states: {
    //         edgeResizing: {
    //           on: {
    //             MOVED_POINTER: { do: "cornerResizeSelectedBoxes" },
    //             SCROLLED: { do: "cornerResizeSelectedBoxes" },
    //           },
    //         },
    //         cornerResizing: {
    //           on: {
    //             MOVED_POINTER: { do: "edgeResizeSelectedBoxes" },
    //             SCROLLED: { do: "edgeResizeSelectedBoxes" },
    //           },
    //           initial: "freeRatio",
    //           states: {
    //             freeRatio: {
    //               onEnter: "updateResizingBoxesToLockedRatio",
    //               on: {
    //                 ENTERED_SHIFT_MODE: { to: "lockedRatio" },
    //               },
    //             },
    //             lockedRatio: {
    //               onEnter: "updateResizingBoxesToFreeRatio",
    //               on: {
    //                 EXITED_SHIFT_MODE: { to: "freeRatio" },
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //     creatingArrow: {
    //       initial: "drawingArrow",
    //       on: {},
    //       states: {
    //         drawingArrow: {},
    //         pickingArrow: {},
    //       },
    //     },
    //   },
    // },
    // drawingBox: {
    //   on: {
    //     CANCELLED: { to: "selected" },
    //   },
    //   initial: "notDrawing",
    //   states: {
    //     notDrawing: {},
    //   },
    // },
    // pickingArrow: {
    //   initial: "choosingFrom",
    //   on: {
    //     CANCELLED: { to: "selected" },
    //   },
    //   states: {
    //     choosingFrom: {},
    //     choosingTo: {},
    //   },
    // },
  },
  results: {
    brushSelectingBoxes(data) {
      const { brush, boxes } = data
      if (!brush) return []
      const { x0, y0, x1, y1 } = brush
      const [minX, maxX] = [Math.min(x0, x1), Math.max(x0, x1)]
      const [minY, maxY] = [Math.min(y0, y1), Math.max(y0, y1)]
      return Object.values(boxes)
        .filter((box) => {
          return !(
            minX > box.x + box.width ||
            minY > box.y + box.height ||
            maxX < box.x ||
            maxY < box.y
          )
        })
        .map((box) => box.id)
    },
  },
  conditions: {
    distanceIsFarEnough(data) {
      const { pointer, initial } = data
      const dist = Math.hypot(
        pointer.x - initial.pointer.x,
        pointer.y - initial.pointer.y
      )
      return dist > 4
    },
    boxIsSelected(data, id: string) {
      return data.selectedBoxIds.includes(id)
    },
    selectionHasChanged(data, _, ids: string[]) {
      return ids.length !== data.selectedBoxIds.length
    },
    isInShiftMode() {
      return pressedKeys.Shift
    },
  },
  actions: {
    // Pointer ------------------------
    updatePointerOnPan(data, delta: IPoint) {
      const { pointer, viewBox, camera } = data
      pointer.dx = delta.x / camera.zoom
      pointer.dy = delta.y / camera.zoom
      pointerState.send("MOVED_POINTER", {
        screen: { ...pointer },
        document: viewBoxToCamera(pointer, viewBox, camera),
      })
    },
    updatePointerOnPointerMove(data, point: IPoint) {
      if (!point) return // Probably triggered by a zoom / scroll
      const { camera, viewBox, pointer } = data
      pointer.dx = (point.x - pointer.x) / camera.zoom
      pointer.dy = (point.y - pointer.y) / camera.zoom
      pointer.x = point.x
      pointer.y = point.y
      pointerState.send("MOVED_POINTER", {
        screen: { ...pointer },
        document: viewBoxToCamera(pointer, viewBox, camera),
      })
    },
    setInitialPointer(data) {
      const { pointer, viewBox, camera } = data
      data.initial.pointer = viewBoxToCamera(pointer, viewBox, camera)
    },

    // Camera -------------------------
    updateCameraZoom(data, change = 0) {
      const { camera, pointer } = data
      const prev = camera.zoom
      const next = clamp(prev - change, 0.25, 2)
      const delta = next - prev
      data.camera.zoom = next
      data.camera.x += ((camera.x + pointer.x) * delta) / prev
      data.camera.y += ((camera.y + pointer.y) * delta) / prev
    },
    updateCameraPoint(data, delta: IPoint) {
      data.camera.x += delta.x
      data.camera.y += delta.y
    },
    updateCameraOnViewBoxChange(data, frame: IFrame) {
      const { viewBox, camera } = data
      if (viewBox.width > 0) {
        camera.x += (viewBox.width - frame.width) / 2
        camera.y += (viewBox.height - frame.height) / 2
      }
    },

    // Viewbox ------------------------
    updateViewBox(data, frame: IFrame) {
      const { viewBox } = data
      viewBox.x = frame.x
      viewBox.y = frame.y
      viewBox.width = frame.width
      viewBox.height = frame.height
    },
    updateViewBoxOnScroll(data, point: IPoint) {
      const { viewBox } = data
      viewBox.x += viewBox.scrollX - point.x
      viewBox.y += viewBox.scrollY - point.y
      viewBox.scrollX = point.x
      viewBox.scrollY = point.y
    },

    // Selection Brush ----------------
    startBrush(data) {
      const { initial, pointer, viewBox, camera } = data
      const { x, y } = viewBoxToCamera(pointer, viewBox, camera)
      data.brush = {
        x0: initial.pointer.x,
        y0: initial.pointer.y,
        x1: x,
        y1: y,
      }
    },
    moveBrush(data) {
      const { brush, pointer, viewBox, camera } = data
      if (!brush) return
      const point = viewBoxToCamera(pointer, viewBox, camera)
      brush.x1 = point.x
      brush.y1 = point.y
    },
    completeBrush(data) {
      data.brush = undefined
    },

    // Selection ----------------------
    selectBox(data, payload = {}) {
      const { id } = payload
      data.selectedBoxIds = [id]
    },
    setSelectedIds(data, _, selectedBoxIds: string[]) {
      data.selectedBoxIds = selectedBoxIds
    },
    clearSelection(data) {
      data.selectedBoxIds = []
      data.bounds = undefined
    },
    setInitialSelectedIds(data) {
      data.initial.selected.boxIds = [...data.selectedBoxIds]
    },

    // Boxes --------------------------
    moveDraggingBoxes(data) {
      const { selectedBoxIds, boxes, pointer } = data

      for (let id of selectedBoxIds) {
        const box = boxes[id]
        box.x += pointer.dx
        box.y += pointer.dy
      }
    },

    // Bounds -------------------------
    moveBounds(data) {
      const { bounds, pointer } = data
      if (!bounds) return
      bounds.x += pointer.dx
      bounds.y += pointer.dy
    },
    updateBounds(data) {
      const { selectedBoxIds, boxes } = data
      if (selectedBoxIds.length === 0) data.bounds = undefined
      data.bounds = getBoundingBox(selectedBoxIds.map((id) => boxes[id]))
    },
    setEdgeResizer(data, edge: number) {
      const { selectedBoxIds, boxes } = data
      const selectedBoxes = selectedBoxIds.map((id) => boxes[id])
      resizer = BoxTransforms.getEdgeResizer(selectedBoxes, edge)
    },
    setCornerResizer(data, corner: number) {
      const { selectedBoxIds, boxes } = data
      const selectedBoxes = selectedBoxIds.map((id) => boxes[id])
      resizer = BoxTransforms.getCornerResizer(selectedBoxes, corner)
    },
    resizeBounds(data) {
      const { selectedBoxIds, bounds, boxes, pointer } = data
      const selectedBoxes = selectedBoxIds.map((id) => boxes[id])
      resizer(selectedBoxes, bounds, pointer)
    },

    // Undo / Redo --------------------
    saveUndoState(data: any) {
      const { boxes, arrows, selectedBoxIds, selectedArrowIds } = data
      const current = JSON.stringify({
        boxes,
        arrows,
        selectedBoxIds,
        selectedArrowIds,
      })
      redos.length = 0
      undos.push(current)
      localStorage.setItem("__2_current", current)
    },
    loadUndoState(data) {
      redos.push(JSON.stringify({ ...data }))
      const undo = undos.pop()
      const json = JSON.parse(undo)
      Object.assign(data, json)
      localStorage.setItem("__2_current", JSON.stringify(undo))
    },
    loadRedoState(data) {
      const redo = undos.pop()
      if (!redo) return

      const json = JSON.parse(redo)
      Object.assign(data, json)
      localStorage.setItem("__2_current", JSON.stringify(redo))
    },
    saveToDatabase(data) {
      const { boxes, arrows, selectedBoxIds, selectedArrowIds } = data
      const current = JSON.stringify({
        boxes,
        arrows,
        selectedBoxIds,
        selectedArrowIds,
      })
      localStorage.setItem("__2_current", current)
    },

    // updateOrigin(data) {
    //   const point = getPoint()
    //   console.log("starting at", point)
    //   origin.x = point.x
    //   origin.y = point.y
    //   cameraOrigin.x = camera.x
    //   cameraOrigin.y = camera.y
    // },
    // // Selection
    // setInitialSelection(data) {
    //   data.initial.selected = {
    //     boxes: data.selectedBoxIds,
    //     arrows: data.selectedArrowIds,
    //   }
    // },
    // clearSelection(data) {
    //   data.selectedBoxIds = []
    //   data.selectedArrowIds = []
    // },
    // completeSelection() {},
    // updateSelectionBrush(data) {
    //   const { x, y, ox, oy } = getPoints()

    //   data.brush = {
    //     x: Math.min(x, ox),
    //     y: Math.min(y, oy),
    //     width: Math.abs(x - ox),
    //     height: Math.abs(y - oy),
    //   }
    // },
    // setbrushSelectingToSelection(data, _, ids) {
    //   data.selectedBoxIds = ids
    // },
    // pushbrushSelectingToSelection(data, _, ids) {
    //   const { boxes } = data.initial.selected
    //   data.selectedBoxIds = [...boxes, ...ids]
    // },
    setInitialSnapshot(data) {
      const { selectedBoxIds, boxes } = data
      const selectedBoxes = selectedBoxIds.map((id) => boxes[id])

      if (selectedBoxes.length === 0) {
        data.initial.boxes = {}
        data.bounds = undefined
      }

      const bounds = getBoundingBox(selectedBoxes)

      let initialBoxes = {}

      for (let box of selectedBoxes) {
        initialBoxes[box.id] = {
          id: box.id,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          nx: (box.x - bounds.x) / bounds.width,
          ny: (box.y - bounds.y) / bounds.height,
          nmx: (box.x + box.width - bounds.x) / bounds.width,
          nmy: (box.y + box.height - bounds.y) / bounds.height,
          nw: box.width / bounds.width,
          nh: box.height / bounds.height,
        }
      }

      data.initial.boxes = initialBoxes
      data.bounds = bounds
    },
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
  values: {
    undosLength() {
      return undos.length
    },
    redosLength() {
      return redos.length
    },
    boundingBox(data) {},
    // selectedBoxes(data) {
    //   const { selectedBoxIds, boxes } = data
    //   return selectedBoxIds.map((id) => boxes[id])
    // },
  },
})

export default state

state.onUpdate((update) => console.log(state.active))
