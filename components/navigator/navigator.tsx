import { useRef, useEffect, memo } from "react"
import { useStateDesigner } from "@state-designer/react"
import { styled } from "../theme"
import state, { data } from "../../pixi/ui-state"
import BoxRow from "./box-row"
import { FixedSizeList as List } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"

const NavigatorWrapper = styled.div({
  // overflowY: "scroll",
  // overflowX: "hidden",
})

const NavigatorList = styled.div({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  flexDirection: "column",
  width: "200px",
  maxWidth: "100vw",
  flexWrap: "wrap",
  borderRight: "1px solid $muted",
  backgroundColor: "$toolbar",
  userSelect: "none",
  fontSize: "$1",
})

const NavigatorListWrapper = styled.div({
  overflowY: "scroll",
  overflowX: "hidden",
})

const BoxRowContainer = styled.button({
  color: "$text",
  background: "transparent",
  textAlign: "left",
  outline: "none",
  border: "none",
  height: 32,
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

function Row({ index, style }: { index: number; style: React.CSSProperties }) {
  const box = data.tree.children[index]
  return (
    <BoxRow
      top={style.top}
      box={box}
      selected={box.selected}
      hovered={box.hovered}
    />
  )
}

export default function Navigator() {
  const rList = useRef<any>(null)
  const local = useStateDesigner(state)
  const boxes = data.tree.children
  const { selected } = local.values

  useEffect(() => {
    const list = rList.current
    if (!list) return

    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].selected) {
        list.scrollToItem(i)
        return
      }
    }
  }, [selected])

  useEffect(() => {
    const list = rList.current
    if (!list) return
    list.forceUpdate()
  })

  return (
    <NavigatorWrapper>
      <AutoSizer>
        {({ height, width }) => {
          return (
            <List
              ref={rList}
              height={height}
              width={width}
              itemCount={boxes.length}
              itemSize={32}
            >
              {Row}
            </List>
          )
        }}
      </AutoSizer>
    </NavigatorWrapper>
  )
}
