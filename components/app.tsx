import * as React from "react"
import { styled } from "./theme"

import useKeyboardEvents from "./hooks/useKeyboardEvents"
import useWindowEvents from "./hooks/useWindowEvents"
import useViewBox from "./hooks/useViewBox"

import Toolbar from "./toolbar/toolbar"
import ZoomIndicator from "./overlays/zoom-indicator"
import Overlays from "./overlays/overlays"
import Canvas from "./canvas-pixi/canvas"

const Container = styled.div({
	width: "100vw",
	height: "100vh",
	position: "absolute",
	top: 0,
	left: 0,
})

export default function App() {
	const { ref, width, height } = useViewBox()

	useWindowEvents()
	useKeyboardEvents()

	// React.useEffect(() => {
	// 	Main.init()
	// }, [])

	return (
		<Container ref={ref}>
			<Canvas width={width} height={height} style={{ userSelect: "none" }} />
			<Overlays />
			<ZoomIndicator />
			<Toolbar />
		</Container>
	)
}
