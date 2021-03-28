import React from "react"
import Pixi from "pixi.js"
import { setup } from "../pixi"
import Toolbar from "./toolbar/toolbar"
import Navigator from "./navigator/navigator"
import StatusBar from "./status-bar"
import { styled } from "./theme"

const Wrapper = styled.div({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "grid",
  gridTemplateColumns: "200px 1fr",
  gridTemplateRows: "auto 1fr 40px",
  maxHeight: "100vh",
  overflow: "hidden",
  minHeight: 0,
})

const CanvasWrapper = styled.div({
  minHeight: 0,
  maxHeight: "100%",
  overflow: "hidden",
})

export default function App({ count }: { count: number }) {
  const rApp = React.useRef<Pixi.Application>(null)
  const rCanvasContainer = React.useRef<HTMLDivElement>(null)
  const rCanvas = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const container = rCanvasContainer.current
    const canvas = rCanvas.current
    if (!(container && canvas)) return

    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight

    const [app, onDestroy] = setup(canvas, container, count)

    rApp.current = app

    return () => {
      onDestroy()

      // const container = rCanvasContainer.current
      // if (!container) return

      // for (let child of Array.from(container.children)) {
      //   container.removeChild(child)
      // }
    }
  }, [])

  return (
    <Wrapper>
      <Toolbar />
      <Navigator />
      {/* <div /> */}
      <CanvasWrapper ref={rCanvasContainer}>
        <canvas ref={rCanvas} />
      </CanvasWrapper>
      <StatusBar />
    </Wrapper>
  )
}
