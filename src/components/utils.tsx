import * as React from "react"
import { S } from "@state-designer/react"

export function syncToState<T extends S.DesignedState<unknown, unknown>>(
	state: T,
	onSync: (update: T) => void,
	test: (update: T, previous: T) => boolean
) {
	let previous: T
	state.getUpdate((update) => (previous = update as T))
	state.onUpdate((update) => {
		const shouldSync = test(update as T, previous)
		previous = update as T
		if (shouldSync) {
			onSync(update as T)
		}
	})
}

export function getPoint(e: React.MouseEvent | PointerEvent) {
	return { x: e.pageX, y: e.pageY }
}
