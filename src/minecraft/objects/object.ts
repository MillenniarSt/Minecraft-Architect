import fs from 'fs-extra'
import path from 'path'
import { RenderObject } from '../render.js'

export class Location {

  constructor(readonly mod: string, readonly id: string) { }

  static minecraft(id: string): Location {
    return new Location('minecraft', id)
  }

  static fromJson(json: string): Location {
    return new Location(
      json.includes(':') ? json.substring(0, json.indexOf(':')) : 'minecraft',
      json.includes(':') ? json.substring(json.indexOf(':') + 1) : json
    )
  }

  toJson(): string {
    return `${this.mod}:${this.id}`
  }

  equals(other: Location): boolean {
    return this.mod == other.mod && this.id == other.id
  }

  toString(): string {
    return this.toJson()
  }

  toDir(): string {
    return `${this.mod}/${this.id}`
  }
}

export abstract class MinecraftObject {

  constructor(readonly location: Location, readonly name: string) { }

  abstract toJson(): any

  abstract get path(): string

  equals(other: MinecraftObject): boolean {
    return this.location === other.location
  }

  save(): void {
    this.saveInFile(this.path, this.toJson())

    const renderToSave = this.renderToSave()
    Object.keys(renderToSave).forEach((renderPath) => {
      this.saveInFile(renderPath, renderToSave[renderPath].toJson())
    })
  }

  private saveInFile(file: string, json: {}) {
    fs.mkdirsSync(path.dirname(file))
    fs.writeFileSync(file, JSON.stringify(json, null, 4).replace(
      /\[\s*([\d.,\s]+)\s*\]/g,
      (_, match) => `[${match.replace(/\s+/g, ' ').trim()}]`
    ))
  }

  abstract renderToSave(): Record<string, RenderObject>
}