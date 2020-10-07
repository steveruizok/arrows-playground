import { createState } from "@state-designer/react"
import { IBox, IArrow } from "../types"
import store from "./store"

let scale = 1
const pressedKeys = {} as Record<string, boolean>
const pointer = { x: 0, y: 0 }
const origin = { x: 0, y: 0 }
const scroll = { x: 2500, y: 2500 }
const scrollOrigin = { x: 2500, y: 2500 }
const viewport = { width: 0, height: 0 }

export default createState({
	data: {},
	on: {},
	actions: {},
})

export function handleKeyDown(e: KeyboardEvent) {
	pressedKeys[e.key] = true
}

export function handleKeyUp(e: KeyboardEvent) {
	pressedKeys[e.key] = false
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
}

export function handleViewportChange(width: number, height: number) {
	viewport.width = width
	viewport.height = height
}
