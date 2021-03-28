import { memo } from "react"
import { styled } from "../theme"
import Box from "../../pixi/shapes/box"
import state from "../../pixi/ui-state"

const BoxRowContainer = styled.button({
  color: "$text",
  background: "transparent",
  textAlign: "left",
  outline: "none",
  border: "none",
  height: 32,
  position: "absolute",
  left: 0,
  p: "$1",
  fontSize: "$1",
  width: "100%",
  cursor: "pointer",
  borderBottom: "1px solid $shadow",
  userSelect: "none",
  variants: {
    selected: {
      notSelected: {},
      selected: {
        backgroundColor: "$selectionMuted",
        color: "$selection",
      },
    },
  },
})

function BoxRow({
  box,
  hovered,
  selected,
  top,
}: // children,
{
  box: Box
  hovered: boolean
  selected: boolean
  top: number | string
  // children?: React.ReactNode
}) {
  return (
    <BoxRowContainer
      selected={selected || hovered ? "selected" : "notSelected"}
      onClick={(e) =>
        state.send("POINTED_BOX_ROW", { boxes: [box], shift: e.shiftKey })
      }
      onPointerEnter={() => state.send("HOVERED_BOXES", { boxes: [box] })}
      onPointerLeave={() => state.send("HOVERED_BOXES", { boxes: [] })}
      style={{ top }}
    >
      {box.name}
    </BoxRowContainer>
  )
}

export default memo(BoxRow)
