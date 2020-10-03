import * as React from "react";

type Props = React.SVGProps<SVGLineElement> & {
  direction: number;
};

function Edge({ direction, ...props }: Props) {
  return (
    <line
      strokeWidth="8"
      stroke={"transparent"}
      cursor={["ns-resize", "ew-resize"][direction]}
      {...props}
    />
  );
}

export default React.memo(Edge);
