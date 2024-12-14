import fs from 'fs-extra'
import path from 'path'
import { RenderObject } from '../render.js'
import { Location } from '../loader.js'

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