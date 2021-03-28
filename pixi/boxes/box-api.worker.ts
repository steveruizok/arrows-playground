import RBush from "rbush"
import * as Types from "../types"
import * as Utils from "../utils"
import * as Comlink from "comlink"
import * as BoxTransforms from "./box-transforms"

/*
Use an rbush tree to store boxes in a way that allows us to rapidly hit test
and use selection boxes. Use boxMap to store local references, so that we can 
later update and remove boxes in the tree.
*/

const boxMap = new Map<string | number, Types.Box>([])

class Bush<T extends Types.Box> extends RBush<T> {
  toBBox(box: Types.Box) {
    return Utils.Bounds.boxToBounds(box)
  }
}

const tree = new Bush()

function clearBoxes() {
  tree.clear()
  return true
}

function remove(boxes: string[]) {
  for (let id of boxes) {
    const b = boxMap.get(id)
    tree.remove(b)
    boxMap.delete(id)
  }
  return true
}

function setBoxes(boxes: Types.Box[]) {
  tree.clear()
  boxMap.clear()
  tree.load(boxes)
  for (let box of boxes) {
    boxMap.set(box.id, box)
  }
  return true
}

function addBox(box: Types.Box) {
  tree.insert(box)
  boxMap.set(box.id, box)
  return true
}

function removeBox(box: Types.Box) {
  if (!boxMap.has(box.id)) return false
  const local = boxMap.get(box.id)
  tree.remove(local)
  boxMap.delete(box.id)
}

function getBox(id: number) {
  return boxMap.get(id)
}

function update(boxes: Types.Box[]) {
  tree.clear()
  for (let box of boxes) {
    boxMap.set(box.id, box)
  }

  tree.load(Array.from(boxMap.values()))
  return true
}

function updateBox(box: Types.Box) {
  if (!boxMap.has(box.id)) return false
  const local = boxMap.get(box.id)
  tree.remove(local)
  boxMap.set(box.id, box)
  tree.insert(box)
  return true
}

function hitTest(frame: Types.Frame): Types.Box[]
function hitTest(point: Types.Point): Types.Box[]
function hitTest(source: Types.Point | Types.Frame) {
  if ((source as Types.Box).width !== undefined) {
    return tree.search(Utils.Bounds.boxToBounds(source as Types.Box))
  } else {
    return tree.search(Utils.Bounds.pointToBounds(source as Types.Point))
  }
}

// Transforms

function alignBoxes(direction: string, ids: string[]) {
  const boxes = ids.map((id) => boxMap.get(id))
  let next: Types.Box[]
  switch (direction) {
    case "top": {
      next = BoxTransforms.alignBoxesTop(boxes)
      break
    }
    case "right": {
      next = BoxTransforms.alignBoxesRight(boxes)
      break
    }
    case "bottom": {
      next = BoxTransforms.alignBoxesBottom(boxes)
      break
    }
    case "left": {
      next = BoxTransforms.alignBoxesLeft(boxes)
      break
    }
    case "centerX": {
      next = BoxTransforms.alignBoxesCenterX(boxes)
      break
    }
    case "centerY": {
      next = BoxTransforms.alignBoxesCenterY(boxes)
      break
    }
  }
  for (let box of next) {
    box.x = Math.round(box.x)
    box.y = Math.round(box.y)
    box.width = Math.round(box.width)
    box.height = Math.round(box.height)
    boxMap.set(box.id, box)
  }
  return next
}

function distributeBoxes(direction: "x" | "y", ids: string[]) {
  const boxes = ids.map((id) => boxMap.get(id))
  const next = Utils.distributeEvenly(direction, boxes)

  for (let box of next) {
    box.x = Math.round(box.x)
    box.y = Math.round(box.y)
    box.width = Math.round(box.width)
    box.height = Math.round(box.height)
    boxMap.set(box.id, box)
  }
  return next
}

function stretchBoxes(direction: "x" | "y", ids: string[]) {
  const boxes = ids.map((id) => boxMap.get(id))
  let next: Types.Box[]
  switch (direction) {
    case "x": {
      next = BoxTransforms.stretchBoxesX(boxes)
      break
    }
    case "y": {
      next = BoxTransforms.stretchBoxesY(boxes)
      break
    }
  }

  for (let box of next) {
    box.x = Math.round(box.x)
    box.y = Math.round(box.y)
    box.width = Math.round(box.width)
    box.height = Math.round(box.height)
    boxMap.set(box.id, box)
  }
  return next
}

const boxApi = {
  addBox,
  getBox,
  updateBox,
  removeBox,
  setBoxes,
  clearBoxes,
  hitTest,
  update,
  alignBoxes,
  distributeBoxes,
  stretchBoxes,
  remove,
}

export type BoxWorkerApi = typeof boxApi

Comlink.expose(boxApi)
