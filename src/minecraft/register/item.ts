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

import { Cube, RenderObject, Texture } from "../render.js"
import { Registry } from "./registry.js"
import path from "path"
import { Vec3 } from "../../world/vector.js"
import { Quaternion } from "../../world/quaternion.js"
import { getProject } from "../../project.js"
import { Location } from "../location.js"

export class Item extends Registry {

  model: ItemModel

  constructor(location: Location, model: ItemModel) {
    super(location)
    this.model = model
  }

  static resource(location: Location, json: any): Item {
    return new Item(location, ItemModel.resource(json))
  }

  static fromJson(location: Location, json: any): Item {
    return new Item(location, ItemModel.fromJson(json.model))
  }

  toJson(): any {
    return {
      model: this.model.toJson(this.location)
    }
  }

  defaultRender(): RenderObject {
    return this.model.render
  }

  get path(): string {
    return getProject().loader.dataFile("item", this.location, "json")
  }

  renderToSave(): Record<string, RenderObject> {
    return Object.fromEntries([
      [path.join(getProject().renderDir, 'items', `${this.location.toDir()}.json`), this.model.render]
    ])
  }
}

export class ItemModel {

  constructor(public render: RenderObject, public display: Display = new Display()) {
    this.render = render
  }

  static fromJson(json: any): ItemModel {
    return new ItemModel(RenderObject.fromFile(json.render), Display.fromJson(json.display))
  }

  static resource(json: any, pTextures: Record<string, string> = {}): ItemModel {
    const model = new ItemModel(new RenderObject())

    const textures: Record<string, string> = {
      ...(json.textures ? Object.fromEntries(
        Object.keys(json.textures).map((key) => {
          const value = json.textures[key]
          return [
            key,
            (value as string)[0] === '#' ? pTextures[(value as string).substring(1)] || json.textures[(value as string).substring(1)] : value
          ]
        })
      ) : {}),
      ...pTextures
    }

    if (json.elements) {
      model.render = new RenderObject(json.elements.map((element: any) => Cube.resource(element, textures)))
    }

    if (json.parent) {
      const parentLoc = Location.fromJson(json.parent)
      if (parentLoc.equals(Location.minecraft('builtin/entity'))) {
        console.warn(`Item model skipped, it is from 'builtin/entity'`)
      } else if (parentLoc.equals(Location.minecraft('item/generated'))) {
        model.render.cubes.push(...Object.keys(textures)
          .filter(layer => layer.indexOf('layer') === 0)
          .map(layer => {
            const cube = new Cube(
              new Vec3(0.5, 0.5, 0),
              new Vec3(1, 1, 1)
            )
            const location = Location.fromJson(textures[layer].replace('/', '\\'))
            const texture = new Texture(location)
            texture.save(getProject().loader.renderFile('textures', location, 'png'), getProject().loader.resource('textures', Location.fromJson(textures[layer]), 'png')!)
            cube.faces[0] = texture
            return cube
          })
        )
        model.display.add(Display.itemGenerated)
      } else if (parentLoc.equals(Location.minecraft('item/handheld'))) {
        model.render.cubes.push(...Object.keys(textures)
          .filter(layer => layer.indexOf('layer') === 0)
          .map(layer => {
            const cube = new Cube(
              new Vec3(0.5, 0.5, 0),
              new Vec3(1, 1, 1)
            )
            const location = Location.fromJson(textures[layer].replace('/', '\\'))
            const texture = new Texture(location)
            texture.save(getProject().loader.renderFile('textures', location, 'png'), getProject().loader.resource('textures', Location.fromJson(textures[layer]), 'png')!)
            cube.faces[0] = texture
            return cube
          })
        )
        model.display.add(Display.itemHandheld)
      } else {
        const parent = ItemModel.resource(getProject().loader.resourceJson('models', Location.fromJson(json.parent)), textures)
        model.render.cubes.push(...parent.render.cubes)
        model.display.add(parent.display)
      }
    }
    return model
  }

  toJson(location: Location): any {
    return {
      display: this.display.toJson(),
      render: path.join(getProject().renderDir, 'items', `${location.toDir()}.json`)
    }
  }
}

export class DisplayConfig {

  constructor(readonly rotation: Quaternion, readonly translation: Vec3, readonly scale: Vec3) { }

  static fromJson(json: Record<string, any>): DisplayConfig {
    return new DisplayConfig(
      json.rotation,
      json.translation,
      json.scale
    )
  }

  toJson(): any {
    return {
      rotation: this.rotation,
      translation: this.translation,
      scale: this.scale
    }
  }
}

export class Display {

  static readonly itemGenerated = new Display(
    new DisplayConfig(Quaternion.NORTH, Vec3.ZERO, Vec3.UNIT),
    new DisplayConfig(Quaternion.SOUTH, Vec3.ZERO, Vec3.UNIT)
  )

  static readonly itemHandheld = new Display(
    new DisplayConfig(Quaternion.NORTH, Vec3.ZERO, Vec3.UNIT),
    new DisplayConfig(Quaternion.SOUTH, Vec3.ZERO, Vec3.UNIT)
  )

  constructor(public gui?: DisplayConfig, public fixed?: DisplayConfig) { }

  static fromJson(json: Record<string, any>): Display {
    return new Display(json.gui ? DisplayConfig.fromJson(json.gui) : undefined, json.fixed ? DisplayConfig.fromJson(json.fixed) : undefined)
  }

  toJson(): any {
    return {
      gui: this.gui?.toJson(),
      fixed: this.fixed?.toJson()
    }
  }

  add(other: Display): void {
    if (!this.gui) {
      this.gui = other.gui
    }
    if (!this.fixed) {
      this.fixed = other.fixed
    }
  }
}