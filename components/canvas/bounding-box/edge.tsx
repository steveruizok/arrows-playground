type Props = React.SVGProps<SVGLineElement> & {
  direction: number
}

export default function Edge({ direction, ...props }: Props) {
  return (
    <line
      strokeWidth="8"
      stroke={"transparent"}
      cursor={["ns-resize", "ew-resize"][direction]}
      {...props}
    />
  )
}
