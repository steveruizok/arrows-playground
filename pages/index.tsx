import dynamic from "next/dynamic"

const App = dynamic(() => import("../components/app"))

export default function Home() {
	return <App />
}
