//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import fs from 'fs-extra'
import path from 'path'
import { RenderObject } from '../render.js'
import { Location } from '../loader.js'
import { iconPath, resourceDir } from '../../paths.js'

export abstract class Registry {

  constructor(readonly location: Location, readonly name: string) { }

  abstract toJson(): any

  abstract get path(): string

  abstract defaultRender(): RenderObject

  secondRender(): RenderObject | undefined {
    return undefined
  }

  equals(other: Registry): boolean {
    return this.location === other.location
  }

  save(): void {
    this.saveInFile(this.path, this.toJson())

    const renderToSave = this.renderToSave()
    Object.keys(renderToSave).forEach((renderPath) => {
      this.saveInFile(renderPath, renderToSave[renderPath].toJson())
    })

    const iconFile = iconPath(this.location)
    try {
      fs.mkdirsSync(path.dirname(iconFile))
      fs.writeFileSync(iconFile, this.defaultRender().toIcon(this.secondRender()))
    } catch(e) {
      console.warn('Can not generate icon of object:', this.location.toString())
      fs.copyFileSync(path.join(resourceDir, 'assets', 'undefined.png'), iconFile)
    }
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