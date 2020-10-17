export interface IPoint {
  x: number
  y: number
}

export interface IPointer extends IPoint {
  dx: number
  dy: number
}

export interface ISize {
  width: number
  height: number
}

export interface IBrush {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface IFrame extends IPoint, ISize {}

export interface IBounds extends IPoint, ISize {
  maxX: number
  maxY: number
}

export interface IBox extends IFrame {
  id: string
  label: string
  color: string
}

export interface IBoxSnapshot extends IFrame {
  id: string
  nx: number
  ny: number
  nmx: number
  nmy: number
  nw: number
  nh: number
}

export interface IArrow {
  id: string
  from: string
  to: string
  flip: boolean
  label: string
  points: number[]
}
