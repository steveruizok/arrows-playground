import throttle from "lodash/throttle"
import { useRef, useEffect, useState } from "react"
import state from "../state"
import { IBox } from "../../types"

type Props = IBox & {
  isSelected: boolean
  isSelecting: boolean
  isEditing: boolean
}

export default function Box(props: Props) {
  const { x, y, width, height, id, label, color } = props
  const { isSelected, isSelecting, isEditing } = props

  const [isHovered, setIsHovered] = useState(false)
  const rInput = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const input = rInput.current
    if (!input) return

    if (isEditing) {
      input.focus()
      const { innerText } = input
      if (innerText.length > 0) {
        const selection = document.getSelection()
        selection && selection.collapse(input, 1)
      }
    } else {
      input.blur()
    }
  }, [isEditing])

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onPointerEnter={() => {
        setIsHovered(true)
        state.send("ENTERED_BOX", { id })
      }}
      onPointerLeave={() => {
        setIsHovered(false)
        state.send("EXITED_BOX", { id })
      }}
      onDoubleClick={(e) => {
        state.send("DOUBLE_CLICKED_BOX", { id, x: e.clientX, y: e.clientY })
      }}
      onPointerDown={(e) => {
        state.send("STARTED_POINTING_BOX", { id, x: e.clientX, y: e.clientY })
      }}
      onPointerUp={(e) => {
        state.send("STOPPED_POINTING_BOX", { id, x: e.clientX, y: e.clientY })
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) {
          state.send("DRAGGED_BOX", { id, x: e.clientX, y: e.clientY })
        }
      }}
    >
      <rect
        width={width}
        height={height}
        stroke={"none"}
        rx={4}
        ry={4}
        fill={color}
        opacity={0.8}
      />
      <rect
        width={width}
        height={height}
        stroke={isSelected ? "#03F" : "#000"}
        rx={4}
        ry={4}
        fill={isEditing ? "rgba(200,200,240,.24)" : "rgba(255, 255, 255, .5)"}
        cursor="grab"
      />
      <g opacity={isHovered ? 1 : 0}>
        <Node
          x={width}
          y={height / 2}
          stroke={"#000"}
          onPointerDown={(e) => {
            state.send("STARTED_CLICKING_ARROW_NODE", {
              id,
              x: e.clientX,
              y: e.clientY,
            })
          }}
          onPointerUp={(e) => {
            state.send("STOPPED_CLICKING_ARROW_NODE", { id })
          }}
        />
      </g>
      <g
        pointerEvents={isSelected ? "all" : "none"}
        opacity={isSelecting ? 0 : 1}
      >
        <foreignObject x="4" y="4" width="12" height="12">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 3,
              width: 8,
              height: 8,
              overflow: "hidden",
              border: "2px solid #000",
              opacity: isSelected ? 1 : 0,
            }}
          >
            <input
              type="color"
              defaultValue={color}
              style={{ opacity: 0 }}
              onChange={(e) => sendBoxColor(id, e.currentTarget.value)}
            />
          </div>
        </foreignObject>
      </g>
      <g pointerEvents={isEditing ? "all" : "none"}>
        <foreignObject x="0" y="0" width={width} height={height}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              padding: 12,
              textAlign: "center",
              fontSize: 13,
              fontWeight: 700,
              color: isEditing ? "#000" : "#333",
            }}
          >
            <div
              ref={rInput}
              style={{ outline: "none", padding: 8 }}
              contentEditable={isEditing}
              onKeyDown={(e) => e.stopPropagation()}
              onBlur={(e) => {
                state.send("STOPPED_EDITING_LABEL", {
                  id,
                  value: e.currentTarget.innerText,
                })
              }}
              suppressContentEditableWarning={true}
            >
              {label}
            </div>
          </div>
        </foreignObject>
      </g>
    </g>
  )
}

const sendBoxColor = throttle((id: string, color: string) => {
  state.send("CHANGED_BOX_COLOR", {
    color,
    id,
  })
}, 60)

type NodeProps = { x: number; y: number } & React.SVGProps<SVGGElement>

function Node({ x, y, ...rest }: NodeProps) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      fill="#0CF"
      cursor="pointer"
      {...rest}
    >
      <circle r={12} cx={0} cy={0} fill="transparent" stroke="none" />
      <circle r={4} cx={0} cy={0} strokeWidth={2} />
    </g>
  )
}
