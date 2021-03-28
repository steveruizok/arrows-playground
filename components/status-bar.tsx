import { useStateDesigner } from "@state-designer/react"
import last from "lodash/last"
import { styled } from "./theme"
import state from "../pixi/ui-state"
import { useRouter } from "next/router"

const BarContainer = styled.div({
  display: "flex",
  gridColumn: "1 / span 2",
  alignItems: "center",
  p: "$1",
  width: "100vw",
  maxWidth: "100vw",
  flexWrap: "wrap",
  borderTop: "1px solid $muted",
  backgroundColor: "$toolbar",
  userSelect: "none",
  fontSize: "$1",
})

export default function StatusBar() {
  const router = useRouter()
  const local = useStateDesigner(state)

  const { count } = router.query
  return (
    <BarContainer>
      Total: {count} - Selected: {local.values.selectedCount} - State:{" "}
      {local.active.map((s) => last(s.split("."))).join(", ")} - Last Event:{" "}
      {local.log[0]}
    </BarContainer>
  )
}
