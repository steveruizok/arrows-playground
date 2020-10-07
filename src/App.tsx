import * as React from "react"
import "./styles.css"
import Container from "./components/Container"
import Guide from "./components/Guide"
import Toolbar from "./components/Toolbar"

import htmlToImage from "html-to-image"
export default function App() {
	React.useEffect(() => {
		document.body.focus()
	}, [])

	const rContainer = React.useRef<HTMLDivElement>(null)

	const saveImage = React.useCallback(() => {
		const node = rContainer.current
		if (!node) return

		htmlToImage
			.toPng(node)
			.then(function (dataUrl) {
				var link = document.createElement("a")
				link.href = dataUrl
				link.download = "download.png"
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
			})
			.catch(function (error) {
				console.error("Couldn't save the file!", error)
			})
	}, [])

	return (
		<div className="App">
			<div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
				<Container ref={rContainer} />
				<div style={{ position: "absolute", top: 8, right: 8 }}>
					<button onClick={() => saveImage()}>Save Image</button>
				</div>
				<div style={{ position: "absolute", bottom: 8, left: 8 }}>
					by <a href="https://twitter.com/steveruizok">@steveruizok</a> -{" "}
					<a href="https://github.com/steveruizok/perfect-arrows">
						perfect-arrows
					</a>{" "}
					-{" "}
					<a href="https://github.com/steveruizok/arrows-playground">
						arrows-playground
					</a>
				</div>
				<Toolbar />
				<Guide />
			</div>
		</div>
	)
}
