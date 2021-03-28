import uniqueId from "lodash/uniqueId"
import pull from "lodash/pull"

class Node<T extends Node<T>> {
  private _id = uniqueId()
  private _name: string
  private _children = new Map<string | number, T>([])
  private _nestingLevel: number

  constructor() {
    this._name = this.id
  }

  addChild(...nodes: T[]) {
    for (let node of nodes) {
      this._children.set(node.id, node)
    }
    return this
  }

  getChildById(id: string | number) {
    return this._children.get(id)
  }

  setChildren(nodes: T[]) {
    this._children.clear()
    for (let node of nodes) {
      this._children.set(node.id, node)
    }
    return this
  }

  removeChild(node: T | string) {
    this._children.delete(typeof node === "string" ? node : node.id)
    return this
  }

  // Getters / Setters

  get id() {
    return this._id
  }

  get isLeaf() {
    return this._children.size === 0
  }

  get children() {
    return Array.from(this._children.values())
  }

  get name() {
    return this._name
  }
  set name(name: string) {
    this._name = name
  }

  get nestingLevel() {
    return this._nestingLevel
  }
  set nestingLevel(level: number) {
    this._nestingLevel = level
  }
}

export default Node
