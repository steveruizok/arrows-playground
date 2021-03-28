export interface Point {
  x: number
  y: number
}

export interface Frame extends Point {
  height: number
  width: number
}

export interface Box extends Frame {
  id: number | string
}

export interface Bounds {
  id: number | string
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface BoxSnapshot {
  nx: number
  nmx: number
  ny: number
  nmy: number
  nw: number
  nh: number
}
