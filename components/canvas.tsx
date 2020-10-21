import * as React from "react"
import { styled } from "./theme"
import NoSSR from "react-no-ssr"

import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox from "./hooks/useViewBox"

import HTMLCanvas from "./canvas-html5/canvas"
import ZoomIndicator from "./overlay/zoom-indicator"
import Positions from "./overlay/overlay"

const Container = styled.div({
	width: "100vw",
	height: "100vh",
	position: "absolute",
	top: 0,
	left: 0,
})

export default function Canvas() {
	const { ref, width, height } = useViewBox()

	useWindowEvents()

	const [showPositions, setShowPositions] = React.useState(true)

	return (
		<Container ref={ref}>
			<NoSSR>
				<HTMLCanvas
					width={width}
					height={height}
					style={{ userSelect: "none" }}
				/>
			</NoSSR>
			<div style={{ position: "absolute", bottom: 8, left: 8 }}>
				{showPositions && <Positions />}
				<button
					style={{ marginTop: 8 }}
					onClick={() => setShowPositions(!showPositions)}
				>
					{showPositions ? "Hide" : "Show"}
				</button>
			</div>
			<ZoomIndicator />
		</Container>
	)
}
