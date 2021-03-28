import Box from "./Box"
import RBush from "rbush"

class Bush<T extends Box> extends RBush<T> {
  toBBox(box: Box) {
    return {
      minX: box.x,
      maxX: box.x + box.width,
      minY: box.y,
      maxY: box.y + box.width,
    }
  }

  chirp() {
    return "Chirp!"
  }
}

export default Bush
