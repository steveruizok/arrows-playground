import * as Types from "../types"
import * as Comlink from "comlink"
import { BoxWorkerApi } from "./box-api.worker"
import * as Pixi from "pixi.js"
import Box from "../shapes/box"
import { getRect } from "../index"
import * as BoxTransforms from "./box-transforms"
import { data } from "../ui-state"
import * as Utils from "../utils"

const worker = new Worker("./box-api.worker", { type: "module" })

const boxWorkerApi = Comlink.wrap<BoxWorkerApi>(worker)

// const boxMap = new Map<number | string, Box>([])

// async function createBox(
//   x: number,
//   y: number,
//   z: number,
//   width: number,
//   height: number
// ) {
//   const rect = getRect(x, y, z, width, height)
//   const box: Types.Box = { id: rect.id, x, y, z, width, height }
//   await boxWorkerApi.addBox(box)
//   boxMap.set(rect.id, rect)
//   return boxMap
// }

// async function moveBoxBy(id: number | string, dx: number, dy: number) {
//   if (!boxMap.has(id)) return false
//   const rect = boxMap.get(id)
//   rect.moveBy(dx, dy)
//   boxWorkerApi.update([rect.getSimpleBox()])
// }

// async function moveBoxTo(id: number | string, x: number, y: number) {
//   if (!boxMap.has(id)) return false
//   const rect = boxMap.get(id)
//   rect.moveTo(x, y)
//   boxWorkerApi.update([rect.getSimpleBox()])
// }

// function batchApply(rs: Box[], change: Partial<Box>) {
//   for (let rect of rs) {
//     if (!boxMap.has(rect.id)) continue
//     const found = boxMap.get(rect.id)
//     Object.assign(found, change)
//   }
// }

async function setBoxes(
  bs: { x: number; y: number; z: number; width: number; height: number }[]
) {
  let toAdd: Box[] = []
  // data.boxes.clear() // For the state, normal Box instances
  const boxes: Types.Box[] = [] // For the worker API, simple box objects

  for (let b of bs) {
    const box = getRect(b.x, b.y, b.z, b.width, b.height)
    toAdd.push(box)

    const simpleBox: Types.Box = box.getSimpleBox()
    boxes.push(simpleBox)
  }

  data.tree.addChild(...toAdd)
  await boxWorkerApi.setBoxes(boxes)

  return data.tree
}

async function deleteBoxes(rs: Box[]) {
  return boxWorkerApi.remove(rs.map((r) => r.id))
}

async function updateBoxes(rs: Box[]) {
  return boxWorkerApi.update(rs.map((r) => r.getSimpleBox()))
}

// Hit Testing

let busy = false
let prev: Types.Box[] = []
let next: any

async function hitTest(frame: Types.Frame): Promise<Box[]>
async function hitTest(point: Types.Point): Promise<Box[]>
async function hitTest(source: Types.Point | Types.Frame) {
  if (busy) {
    next = source
    return prev
  } else {
    busy = true
    next = undefined
    const boxMap = await processHitsQueue(source)
    busy = false
    return boxMap
  }
}

function hitTestFast(point: Types.Point): Box[] {
  const hits = data.tree.children.filter((box) => box.hitTest(point))
  return hits
  // const result = await boxWorkerApi.hitTest(source)
  // prev = result.map((box) => data.tree.getChildById(box.id))
  // return prev.sort((a, b) => a.z - b.z)
}

async function processHitsQueue(source: Types.Point | Types.Frame) {
  const result = await boxWorkerApi.hitTest(source)
  prev = result.map((box) => data.tree.getChildById(box.id))

  if (next !== undefined) {
    let t = next
    next = undefined
    return processHitsQueue(t)
  } else {
    return prev
  }
}

// Align / Stretch

async function alignBoxes(direction: string, boxes: Box[]) {
  const result = await boxWorkerApi.alignBoxes(
    direction,
    boxes.map((box) => box.id)
  )

  for (let res of result) {
    const found = data.tree.getChildById(res.id)
    found.moveTo(res.x, res.y)
  }
}

async function stretchBoxes(direction: "x" | "y", boxes: Box[]) {
  const result = await boxWorkerApi.stretchBoxes(
    direction,
    boxes.map((box) => box.id)
  )

  for (let res of result) {
    const found = data.tree.getChildById(res.id)
    found.setFrame(res.x, res.y, res.width, res.height)
  }
}

async function distributeBoxes(direction: "x" | "y", boxes: Box[]) {
  const result = await boxWorkerApi.distributeBoxes(
    direction,
    boxes.map((box) => box.id)
  )

  for (let res of result) {
    const found = data.tree.getChildById(res.id)
    found.moveTo(res.x, res.y)
  }
}

// Resizing

let resizer: BoxTransforms.BoxResizer

function startEdgeResizingBoxes(boxes: Box[], edge: number) {
  resizer = BoxTransforms.getEdgeResizer(boxes, edge)
  return true
}

function startCornerResizingBoxes(boxes: Box[], corner: number) {
  resizer = BoxTransforms.getCornerResizer(boxes, corner)
  return true
}

function resizeBoxes(point: Types.Point) {
  const [results, bounds] = resizer(point)
  for (let { id, x, y, width, height } of results) {
    const found = data.tree.getChildById(id)
    found.setFrame(x, y, width, height) // Mutate boxes directly?
  }
  return bounds
}

const boxApi = {
  // moveBoxBy,
  // moveBoxTo,
  // batchApply,
  // createBox,
  deleteBoxes,
  setBoxes,
  hitTest,
  hitTestFast,
  updateBoxes,
  alignBoxes,
  stretchBoxes,
  distributeBoxes,
  startEdgeResizingBoxes,
  startCornerResizingBoxes,
  resizeBoxes,
}

export type BoxApi = typeof boxApi

export default boxApi
