import { expose } from "comlink"
import RBush from "rbush"

// class Bush<T extends Box> extends RBush<T> {
//   toBBox(box: Box) {
//     return {
//       minX: box.x,
//       maxX: box.x + box.width,
//       minY: box.y,
//       maxY: box.y + box.width,
//     }
//   }
// }

type BBox = {
  id: number
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const bush = new RBush<BBox>()

async function clear() {
  bush.clear()
  return "cleared"
}

async function setBoxes(boxes: BBox[]) {
  bush.clear()
  bush.load(boxes)
  return "Loaded boxes."
}

async function search(minX: number, minY: number, maxX: number, maxY: number) {
  const results = bush.search({ minX, maxX, minY, maxY }).map((b) => b.id)
  return results
}

const api = {
  setBoxes,
  clear,
  search,
}

export type SelectionApi = typeof api

expose(api)

// import Box from "../lib/Box"
// import RBush from "rbush"

// export class Bush<T extends Box> extends RBush<T> {
//   toBBox(box: Box) {
//     return {
//       minX: box.x,
//       maxX: box.x + box.width,
//       minY: box.y,
//       maxY: box.y + box.width,
//     }
//   }
// }

// // Provide a definition for Worker global scope
// export const bush = new Bush()

// export const handleMessage = async function (message: string) {
//   console.log("got message", message)
// }

// expose({ handleMessage, bush })

// export default bush
