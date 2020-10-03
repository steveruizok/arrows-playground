declare namespace Chart {
  interface Point {
    x: number;
    y: number;
  }

  interface Size {
    width: number;
    height: number;
  }

  interface Box extends Point, Size {
    id: string;
    label: string;
    color: string;
  }

  interface Arrow {
    id: string;
    from: string;
    to: string;
    flip: boolean;
    label: string;
    points: string;
  }
}
