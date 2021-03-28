import * as Types from "../types"
import * as Comlink from "comlink"
import { BoxWorkerApi } from "./box-api.worker"
import * as Pixi from "pixi.js"
import Box from "../shapes/box"
import { getRect } from "../index"

const worker = new Worker("./box-api.worker", { type: "module" })

const boxWorkerApi = Comlink.wrap<BoxWorkerApi>(worker)

const rects = new Map<number | string, Box>([])

async function createBox(x: number, y: number, width: number, height: number) {
  const rect = getRect(x, y, width, height)
  const box: Types.Box = { id: rect.id, x, y, width, height }
  await boxWorkerApi.addBox(box)
  rects.set(rect.id, rect)
  return rects
}

async function setBoxes(
  bs: { x: number; y: number; width: number; height: number }[]
) {
  rects.clear()
  const boxes: Types.Box[] = []

  for (let b of bs) {
    const rect = getRect(b.x, b.y, b.width, b.height)
    const box: Types.Box = rect.getSimpleBox()
    rects.set(rect.id, rect)
    boxes.push(box)
  }

  await boxWorkerApi.setBoxes(boxes)

  return rects
}

async function moveBoxBy(id: number | string, dx: number, dy: number) {
  if (!rects.has(id)) return false
  const rect = rects.get(id)
  rect.moveBy(dx, dy)
  boxWorkerApi.update([rect.getSimpleBox()])
}

async function moveBoxTo(id: number | string, x: number, y: number) {
  if (!rects.has(id)) return false
  const rect = rects.get(id)
  rect.moveTo(x, y)
  boxWorkerApi.update([rect.getSimpleBox()])
}

function batchApply(rs: Box[], change: Partial<Box>) {
  for (let rect of rs) {
    if (!rects.has(rect.id)) continue
    const found = rects.get(rect.id)
    Object.assign(found, change)
  }
}

async function updateBoxes(rs: Box[]) {
  return boxWorkerApi.update(rs.map((r) => r.getSimpleBox()))
}

function boxes() {
  return Array.from(rects.values())
}

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
    const rects = await processHitsQueue(source)
    busy = false
    return rects
  }
}

async function processHitsQueue(source: Types.Point | Types.Frame) {
  const result = await boxWorkerApi.hitTest(source)
  prev = result.map((box) => rects.get(box.id))
  if (next !== undefined) {
    let t = next
    next = undefined
    return processHitsQueue(t)
  } else {
    return prev
  }
}

// Transforms

async function alignBoxes(direction: string, boxes: Box[]) {
  const result = await boxWorkerApi.alignBoxes(
    direction,
    boxes.map((box) => box.id)
  )

  for (let res of result) {
    if (!rects.has(res.id)) continue
    const found = rects.get(res.id)
    found.moveTo(res.x, res.y)
  }
}

async function stretchBoxes(direction: "x" | "y", boxes: Box[]) {
  const result = await boxWorkerApi.stretchBoxes(
    direction,
    boxes.map((box) => box.id)
  )

  for (let res of result) {
    if (!rects.has(res.id)) continue
    const found = rects.get(res.id)
    found.setFrame(res.x, res.y, res.width, res.height)
  }
}

const boxApi = {
  createBox,
  moveBoxBy,
  moveBoxTo,
  setBoxes,
  hitTest,
  boxes,
  updateBoxes,
  batchApply,
  alignBoxes,
  stretchBoxes,
}

export type BoxApi = typeof boxApi

export default boxApi
