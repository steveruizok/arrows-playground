import * as React from "react"

type Props = React.SVGProps<SVGGElement> & {
  direction: number
}

function Corner({ x, y, direction, ...props }: Props) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      cursor={["nwse-resize", "nesw-resize"][direction % 2]}
      {...props}
    >
      <circle cx={0} cy={0} r={4} fill="#aaf" strokeWidth={2} />
      <circle cx={0} cy={0} r={12} fill="transparent" stroke="none" />
    </g>
  )
}

export default React.memo(Corner)
