import React from "react"
import Two from "two.js"
import { setup } from "../two"

export default function App({ count }: { count: number }) {
  const rTwo = React.useRef<Two>(null)
  const rCanvasContainer = React.useRef<HTMLDivElement>(null)

  async function setupTwo() {
    const prev = rTwo.current
    const container = rCanvasContainer.current
    if (!container) return
    if (prev) prev.pause()

    const two = await setup(container, count)
    rTwo.current = two
  }

  React.useEffect(() => void setupTwo())

  return (
    <div ref={() => Math.random()}>
      <div ref={rCanvasContainer} style={{ width: "100vw", height: "100vh" }} />
    </div>
  )
}
