import * as React from "react"
import { createState, useStateDesigner } from "@state-designer/react"

let initial = "open"

if (localStorage) {
	const t = localStorage.getItem("__guide_state")
	if (t !== null) {
		initial = t
	}
}

const state = createState({
	initial,
	states: {
		open: {
			on: {
				TOGGLED: { to: "closed" },
			},
		},
		closed: {
			on: {
				TOGGLED: { to: "open" },
			},
		},
	},
})

state.onUpdate(({ isIn }) => {
	if (localStorage) {
		localStorage.setItem("__guide_state", isIn("open") ? "open" : "closed")
	}
})

export default function Guide() {
	const local = useStateDesigner(state)

	return (
		<section
			style={{
				padding: local.isIn("open") ? 16 : 0,
				position: "absolute",
				right: 8,
				bottom: 8,
				backgroundColor: "rgba(255, 255, 255, .95)",
				borderRadius: 8,
			}}
		>
			<button style={{ float: "right" }} onClick={() => local.send("TOGGLED")}>
				{local.whenIn({
					open: "close",
					closed: "help",
				})}
			</button>
			{local.isIn("open") && (
				<div>
					<h2>Guide</h2>
					<ul>
						<li>Click and drag on the canvas to create boxes.</li>
						<li>
							Click and drag a box's blue node to create arrows between boxes.
						</li>
						<li>Drag a box to move it.</li>
						<li>Drag a box's corners and edges to resize it.</li>
						<li>Press delete to remove a box or arrow.</li>
						<li>Double click a box to edit its text label.</li>
						<li>Double click an arrow to edit its text label.</li>
						<li>Click an arrow to select it.</li>
						<li>
							With an arrow selected...
							<ul>
								<li>
									Press <b>/</b> to flip it.
								</li>
								<li>
									Press <b>Delete</b> to delete it.
								</li>
							</ul>
						</li>
						<li>Click a box to select it.</li>
						<li>
							With a box selected...
							<ul>
								<li>
									Press <b>/</b> to flip its arrows.
								</li>
								<li>
									Press <b>Delete</b> to delete it.
								</li>
								<li>Tap the corner box to change its color.</li>
							</ul>
						</li>
						<li>Hold space and drag to pan.</li>
					</ul>
				</div>
			)}
		</section>
	)
}
