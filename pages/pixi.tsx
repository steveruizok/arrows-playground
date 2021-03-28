import React from "react"
import dynamic from "next/dynamic"

const App = dynamic(() => import("../components/pixi-app"), {
  ssr: false,
})

export default function Home() {
  return <App count={10000} />
}
