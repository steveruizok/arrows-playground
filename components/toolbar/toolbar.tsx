import state from "../state"
import { useStateDesigner } from "@state-designer/react"
import { ToolbarWrapper, ButtonGroup, Divider } from "./styled"
import IconButton from "./icon-button"

type Props = {}

export default function Toolbar(props: Props) {
  const local = useStateDesigner(state)

  const { selectedBoxIds, selectedArrowIds } = local.data

  const hasSelection = selectedBoxIds.length + selectedArrowIds.length > 0
  const hasSelectedBox = selectedBoxIds.length > 0
  const hasSelectedBoxes = selectedBoxIds.length > 1
  const hasManySelectedBoxes = selectedBoxIds.length > 2

  return (
    <ToolbarWrapper onClick={(e) => e.stopPropagation()}>
      <ButtonGroup>
        <IconButton
          src="Select"
          isActive={local.isIn("selecting")}
          event="SELECTED_SELECT_TOOL"
          shortcut="V"
        />
        <IconButton
          src="Box"
          isActive={local.isIn("drawing")}
          onClick={() => state.send("SELECTED_BOX_TOOL")}
          event="SELECTED_BOX_TOOL"
          shortcut="F"
        />
        <Divider />
        <IconButton
          src="Arrow"
          event="STARTED_PICKING_ARROW"
          shortcut="A"
          disabled={!hasSelectedBox}
        />
        <IconButton
          src="Delete"
          event="DELETED_SELECTED"
          shortcut="⌫"
          disabled={!hasSelection}
        />
        <IconButton
          src="FlipArrow"
          event="FLIPPED_ARROWS"
          shortcut="T"
          disabled={!hasSelection}
        />
        <IconButton
          src="InvertArrow"
          event="INVERTED_ARROWS"
          shortcut="R"
          disabled={!hasSelection}
        />
        <Divider />
        <IconButton
          src="Left"
          event="ALIGNED_LEFT"
          disabled={!hasSelectedBoxes}
          shortcut=";"
        />
        <IconButton
          src="CenterX"
          event="ALIGNED_CENTER_X"
          disabled={!hasSelectedBoxes}
          shortcut="'"
        />
        <IconButton
          src="Right"
          event="ALIGNED_RIGHT"
          disabled={!hasSelectedBoxes}
          shortcut="\"
        />
        <IconButton
          src="Top"
          event="ALIGNED_TOP"
          disabled={!hasSelectedBoxes}
          shortcut="⇧ ;"
        />
        <IconButton
          src="CenterY"
          event="ALIGNED_CENTER_Y"
          disabled={!hasSelectedBoxes}
          shortcut="⇧ '"
        />
        <IconButton
          src="Bottom"
          event="ALIGNED_BOTTOM"
          disabled={!hasSelectedBoxes}
          shortcut="⇧ \"
        />
        <Divider />
        <IconButton
          src="StretchX"
          event="STRETCHED_X"
          disabled={!hasSelectedBoxes}
          shortcut="⇧ ["
        />
        <IconButton
          src="StretchY"
          event="STRETCHED_Y"
          disabled={!hasSelectedBoxes}
          shortcut="⇧ ]"
        />

        <Divider />
        <IconButton
          src="DistributeX"
          event="DISTRIBUTED_X"
          disabled={!hasManySelectedBoxes}
        />
        <IconButton
          src="DistributeY"
          event="DISTRIBUTED_Y"
          disabled={!hasManySelectedBoxes}
        />
      </ButtonGroup>
      <ButtonGroup>
        <IconButton
          src="Undo"
          event="UNDO"
          shortcut="⌘ Z"
          disabled={local.values.undosLength === 1}
        />
        <IconButton
          src="Redo"
          event="REDO"
          shortcut="⌘ ⇧ Z"
          disabled={local.values.redosLength === 0}
        />
      </ButtonGroup>
    </ToolbarWrapper>
  )
}
