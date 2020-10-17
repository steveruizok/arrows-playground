import { memo } from "react"
import { IBox } from "../../types"
import Box from "./box"

type Props = {
  boxes: IBox[]
  isEditing: boolean
  isSelecting: boolean
  selectedBoxIds: string[]
}

function boxes({ boxes, isEditing, isSelecting, selectedBoxIds }: Props) {
  return (
    <g>
      {boxes.map((box) => (
        <Box
          key={box.id}
          isSelected={selectedBoxIds.includes(box.id)}
          isEditing={isEditing}
          isSelecting={isSelecting}
          {...box}
        />
      ))}
    </g>
  )
}

export default memo(boxes)
