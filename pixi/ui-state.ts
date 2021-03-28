import { createState } from "@state-designer/core"
import * as Types from "./types"
import Node from "./shapes/node"
import Box from "./shapes/box"
import Brush from "./shapes/brush"
import Point from "./shapes/point"
import boxApi from "./boxes/box-api"
import difference from "lodash/difference"
import maxBy from "lodash/maxBy"
import * as BoxTransforms from "./boxes/box-transforms"
import * as Pixi from "pixi.js"

export const brush = new Brush()
export const surface = new Pixi.Graphics()

export type Data = {
  tree: Node<Box>
  // boxes: Map<string | number, Box>
  selected: Box[]
  hovered: Box[]
  pointerStart: Point
  pointer: Point
  delta: Point
}

export const data: Data = {
  tree: new Node(),
  // boxes: new Map([]),
  selected: [],
  hovered: [],
  pointerStart: new Point(0, 0),
  pointer: new Point(0, 0),
  delta: new Point(0, 0),
}

const state = createState({
  on: {
    MOVED_POINTER: {
      secretlyDo: ["setPointer"],
    },
    DOWNED_POINTER: {
      do: "setPointerStart",
    },
    LOADED_BOXES: {
      do: "setBoxes",
    },
  },
  states: {
    tools: {
      on: {
        SELECTED_SELECT_TOOL: { to: "selectTool" },
        SELECTED_BOX_TOOL: { to: "boxTool" },
        SELECTED_ARROW_TOOL: { to: "arrowTool" },
      },
      initial: "selectTool",
      states: {
        selectTool: {
          on: {},
          initial: "selectIdle",
          states: {
            selectIdle: {
              onExit: "clearHovered",
              on: {
                ALIGNED_LEFT: {
                  if: "hasSelected",
                  do: "alignSelectedBoxesLeft",
                },
                ALIGNED_RIGHT: {
                  if: "hasSelected",
                  do: "alignSelectedBoxesRight",
                },
                ALIGNED_CENTER_X: {
                  if: "hasSelected",
                  do: "alignSelectedBoxesCenterX",
                },
                ALIGNED_TOP: {
                  if: "hasSelected",
                  do: "alignSelectedBoxesTop",
                },
                ALIGNED_BOTTOM: {
                  if: "hasSelected",
                  do: "alignSelectedBoxesBottom",
                },
                ALIGNED_CENTER_Y: {
                  if: "hasSelected",
                  do: "alignSelectedBoxesCenterY",
                },
                DISTRIBUTED_X: {
                  if: "hasSelected",
                  do: "distributeSelectedBoxesX",
                },
                DISTRIBUTED_Y: {
                  if: "hasSelected",
                  do: "distributeSelectedBoxesY",
                },
                STRETCHED_X: {
                  if: "hasSelected",
                  do: "stretchSelectedBoxesX",
                },
                STRETCHED_Y: {
                  if: "hasSelected",
                  do: "stretchSelectedBoxesY",
                },
                MOVED_BOXES_FORWARD: {
                  if: "hasSelected",
                  do: "moveBoxesForward",
                },
                MOVED_BOXES_BACKWARD: {
                  if: "hasSelected",
                  do: "moveBoxesBackward",
                },
                MOVED_POINTER_OVER_CANVAS: {
                  secretlyDo: ["setCursor", "getHovered"],
                },
                POINTED_BRUSH: {
                  to: "dragging",
                },
                POINTED_BRUSH_EDGE: {
                  do: "setEdgeResizer",
                  to: "resizing",
                },
                POINTED_BRUSH_CORNER: {
                  do: "setCornerResizer",
                  to: "resizing",
                },
                DELETED: {
                  do: ["deleteSelectedBoxes", "hideBrush"],
                },
                POINTED_BOX_ROW: [
                  {
                    if: "isPressingShift",
                    do: "addBoxToSelected",
                    else: "setSelected",
                  },
                  "fitBrushToSelected",
                  "hideBrushCorners",
                  "showBrush",
                ],
                POINTED_BOX: [
                  {
                    if: "isPressingShift",
                    do: "addBoxToSelected",
                    else: "setSelected",
                  },
                  {
                    do: ["fitBrushToSelected", "hideBrushCorners", "showBrush"],
                    to: "dragging",
                  },
                ],
                POINTED_CANVAS: {
                  unless: "isPressingShift",
                  do: ["clearSelected", "hideBrushCorners", "hideBrush"],
                  to: "pointingCanvas",
                },
                SELECTED_BOXES: {
                  if: "selectionWouldUpdate",
                  do: [
                    "setSelected",
                    "showBrushCorners",
                    "fitBrushToSelected",
                    "showBrush",
                  ],
                },
                HOVERED_BOXES: {
                  do: "setHovered",
                },
                // UNHOVERED: {
                //   do: "clearHovered",
                // },
              },
            },
            pointingCanvas: {
              on: {
                MOVED_POINTER: {
                  unless: "deltaIsBelowClickThreshold",
                  to: "brushSelecting",
                },
                RAISED_POINTER: {
                  to: "selectIdle",
                },
              },
            },
            brushSelecting: {
              onEnter: ["updateDraggingBrush", "hideBrushCorners", "showBrush"],
              on: {
                MOVED_POINTER: {
                  secretlyDo: ["updateDraggingBrush", "setBrushSelected"],
                },
                SELECTED_BOXES: {
                  if: "selectionWouldUpdate",
                  do: "setSelected",
                },
                RAISED_POINTER: [
                  {
                    if: "hasSelected",
                    do: ["fitBrushToSelected", "showBrushCorners"],
                    else: "hideBrush",
                  },
                  { to: "selectIdle" },
                ],
              },
            },
            resizing: {
              onEnter: "hideBrushCorners",
              onExit: ["updateSelectedBoxes", "showBrushCorners"],
              on: {
                MOVED_POINTER: {
                  secretlyDo: ["resizeSelectedBoxes"],
                },
                RAISED_POINTER: {
                  to: "selectIdle",
                },
              },
            },
            dragging: {
              onEnter: "hideBrushCorners",
              onExit: ["updateSelectedBoxes", "showBrushCorners"],
              on: {
                MOVED_POINTER: {
                  secretlyDo: ["moveSelectedBoxes", "moveBrush"],
                },
                RAISED_POINTER: {
                  to: "selectIdle",
                },
              },
            },
          },
        },
        arrowTool: {
          on: {},
        },
        boxTool: {
          on: {},
        },
      },
    },
  },
  conditions: {
    isPressingShift(_, payload: { shift: boolean }) {
      console.log(payload.shift)
      return !!payload.shift
    },
    selectionWouldUpdate(_, payload: { boxes: Box[] }) {
      const { boxes } = payload
      const { selected } = data
      if (boxes.length === 0 && selected.length > 0) {
        return true
      }

      if (
        boxes.length !== selected.length ||
        difference(boxes, selected).length > 0
      ) {
        return true
      }

      return false
    },
    deltaIsBelowClickThreshold() {
      const { delta } = data
      return Math.hypot(delta.x, delta.y) < 4
    },
    deltaIsBelowDragThreshold() {
      const { delta } = data
      return Math.hypot(delta.x, delta.y) < 32
    },
    hasSelected() {
      return data.selected.length > 0
    },
  },
  actions: {
    // Pointer
    setPointer(_, payload: { point: Types.Point }) {
      const { x, y } = payload.point
      const { delta, pointer } = data
      delta.set(x - pointer.x, y - pointer.y)
      pointer.set(x, y)
    },
    setPointerStart(_, payload: { point: Types.Point }) {
      const { x, y } = payload.point
      const { pointerStart } = data
      pointerStart.set(x, y)
    },
    // Selection
    addBoxToSelected(_, payload: { boxes: Box[] }) {
      const { boxes } = payload
      for (let box of boxes) {
        box.selected = true
        data.selected.push(box)
      }

      console.log(data.selected)
    },
    setSelected(_, payload: { boxes: Box[] }) {
      const { boxes } = payload
      const { selected } = data

      if (boxes.length === 0) {
        // Has selected, no new selected
        for (let box of selected) {
          box.selected = false
        }
      } else if (selected.length === 0) {
        // New selected, no current selected
        for (let box of boxes) {
          box.selected = true
        }
      } else {
        // Has selected, has new selected too
        for (let box of selected) {
          if (!boxes.includes(box)) {
            box.selected = false
          }
        }

        for (let box of boxes) {
          if (!selected.includes(box)) {
            box.selected = true
          }
        }
      }

      data.selected = boxes
    },
    clearSelected() {
      const { selected } = data
      for (let box of selected) {
        box.selected = false
      }

      selected.length = 0
    },
    getHovered() {
      const { x, y } = data.pointer

      boxApi.hitTest({ x, y }).then((hovered) => {
        if (hovered.length === 0 && data.hovered.length > 0) {
          state.send("HOVERED_BOXES", { boxes: [] })
        } else {
          if (hovered.length > 0) {
            const next = [maxBy(hovered, "z")]
            if (data.hovered.length > 0) {
              if (next[0] === data.hovered[0]) return
            }
            state.send("HOVERED_BOXES", { boxes: [maxBy(hovered, "z")] })
          }
        }
      })
    },
    setHovered(_, payload: { boxes: Box[] }) {
      const { boxes } = payload
      const { hovered } = data

      if (boxes.length === 0) {
        // Has selected, no new selected
        for (let box of hovered) {
          box.hovered = false
        }
      } else if (hovered.length === 0) {
        // New selected, no current selected
        for (let box of boxes) {
          box.hovered = true
        }
      } else {
        // Has selected, has new selected too
        for (let box of hovered) {
          if (!boxes.includes(box)) {
            box.hovered = false
          }
        }

        for (let box of boxes) {
          if (!hovered.includes(box)) {
            box.hovered = true
          }
        }
      }

      data.hovered = boxes
    },
    clearHovered() {
      const { hovered } = data
      for (let box of hovered) {
        box.hovered = false
      }

      hovered.length = 0
    },
    // Boxes
    createBox() {},
    deleteBox() {},
    setBoxes(_, payload: { boxes: Box[] }) {
      const { tree } = data
      const { boxes } = payload
      for (let box of boxes) {
        tree.children[box.id].set(box)
      }
    },
    moveSelectedBoxes() {
      const { delta, selected } = data
      for (let box of selected) {
        box.moveBy(delta.x, delta.y)
      }
    },
    // Alignment
    async alignSelectedBoxesLeft() {
      const { selected } = data
      await boxApi.alignBoxes("left", selected)
      brush.fit(data.selected)
    },
    async alignSelectedBoxesRight() {
      const { selected } = data
      await boxApi.alignBoxes("right", selected)
      brush.fit(data.selected)
    },
    async alignSelectedBoxesCenterX() {
      const { selected } = data
      await boxApi.alignBoxes("centerX", selected)
      brush.fit(data.selected)
    },
    async alignSelectedBoxesTop() {
      const { selected } = data
      await boxApi.alignBoxes("top", selected)
      brush.fit(data.selected)
    },
    async alignSelectedBoxesBottom() {
      const { selected } = data
      await boxApi.alignBoxes("bottom", selected)
      brush.fit(data.selected)
    },
    async alignSelectedBoxesCenterY() {
      const { selected } = data
      await boxApi.alignBoxes("centerY", selected)
      brush.fit(data.selected)
    },
    async stretchSelectedBoxesX() {
      const { selected } = data
      await boxApi.stretchBoxes("x", selected)
      brush.fit(data.selected)
    },
    async stretchSelectedBoxesY() {
      const { selected } = data
      await boxApi.stretchBoxes("y", selected)
      brush.fit(data.selected)
    },
    async distributeSelectedBoxesX() {
      const { selected } = data
      await boxApi.distributeBoxes("x", selected)
      brush.fit(data.selected)
    },
    async distributeSelectedBoxesY() {
      const { selected } = data
      await boxApi.distributeBoxes("y", selected)
      brush.fit(data.selected)
    },
    // Resizing
    setEdgeResizer(_, payload: { edge: number }) {
      const { edge } = payload
      const { selected } = data
      boxApi.startEdgeResizingBoxes(selected, edge)
    },
    setCornerResizer(_, payload: { corner: number }) {
      const { corner } = payload
      const { selected } = data
      boxApi.startCornerResizingBoxes(selected, corner)
    },
    resizeSelectedBoxes(_, payload: { point: Types.Point }) {
      const { point } = payload
      const bounds = boxApi.resizeBoxes(point)
      brush.setBounds(bounds)
    },
    updateSelectedBoxes() {
      const { selected } = data
      boxApi.updateBoxes(selected)
    },
    // Order
    moveBoxesForward() {
      const { selected, tree } = data
      const movers = selected.sort((b, a) => a.z - b.z)
      const shakers = Array.from(tree.children.values()).filter(
        (b) => !movers.includes(b)
      )
      for (let mover of movers) {
        const shaker = shakers.find((b) => b.z === mover.z + 1)
        if (shaker) {
          shaker.z--
          mover.z++
        }
      }
    },
    moveBoxesBackward() {
      const { selected, tree } = data
      const movers = selected.sort((b, a) => b.z - a.z)
      const shakers = Array.from(tree.children.values()).filter(
        (b) => !movers.includes(b)
      )
      for (let mover of movers) {
        const shaker = shakers.find((b) => b.z === mover.z - 1)
        if (shaker) {
          shaker.z++
          mover.z--
        }
      }
    },
    deleteSelectedBoxes() {
      const { selected } = data
      const { tree } = data
      boxApi.deleteBoxes(selected)
      for (let box of selected) {
        box.destroy()
        tree.removeChild(box.id)
      }
      selected.length = 0
    },
    // Brush
    hideBrush() {
      brush.hide()
    },
    showBrush() {
      brush.show()
    },
    moveBrush() {
      const { delta } = data
      brush.moveBy(delta.x, delta.y)
    },
    fitBrushToSelected() {
      brush.fit(data.selected)
    },
    hideBrushCorners() {
      brush.hideCorners()
    },
    showBrushCorners() {
      brush.showCorners()
    },
    updateDraggingBrush() {
      const { pointer, pointerStart } = data
      brush.fitPoints(pointer, pointerStart)
    },
    async setBrushSelected() {
      const boxes = await boxApi.hitTest(brush.getSimpleBox())
      state.send("SELECTED_BOXES", { boxes })
    },
    // Misc
    setCursor() {
      const { pointer } = data
      const hit = brush.hitTest(pointer)
      if (!hit) {
        document.body.style.cursor = "default"
        return
      }

      switch (hit.type) {
        case "edge": {
          document.body.style.cursor =
            hit.edge % 2 === 0 ? "ns-resize" : "ew-resize"
          break
        }
        case "corner": {
          document.body.style.cursor =
            hit.corner % 2 === 0 ? "nwse-resize	" : "nesw-resize"
          break
        }
        default: {
          document.body.style.cursor = "default"
        }
      }
    },
  },
  values: {
    selected() {
      return data.selected
    },
    selectedCount() {
      return data.selected.length
    },
    pointer() {
      return data.pointer
    },
    undosLength() {
      return 0
    },
    redosLength() {
      return 0
    },
    boxes() {
      return data.tree.children
    },
    tree() {
      return data.tree
    },
  },
})

export default state

// state.onUpdate((update) => console.log(update.log))
