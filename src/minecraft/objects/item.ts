import { Cube, RenderObject, Texture } from "../render.js"
import { Pos3D, Rotation3D, Size3D } from "../../world/world3D.js"
import { MinecraftObject } from "./object.js"
import { loader, Location } from "../loader.js"
import path from "path"

export class Item extends MinecraftObject {

  model: ItemModel

  constructor(location: Location, name: string, model: ItemModel) {
    super(location, name)
    this.model = model
  }

  static resource(location: Location, name: string, json: any): Item {
    return new Item(location, name, ItemModel.resource(json))
  }

  static fromJson(location: Location, json: any): Item {
    return new Item(location, json.name, ItemModel.fromJson(json.model))
  }

  toJson(): any {
    return {
      name: this.name,
      model: this.model.toJson(this.location)
    }
  }

  defaultRender(): RenderObject {
    return this.model.render
  }

  get path(): string {
    return loader.dataFile("item", this.location, "json")
  }

  renderToSave(): Record<string, RenderObject> {
    return Object.fromEntries([
      [path.join(loader.renderDir, 'items', `${this.location.toDir()}.json`), this.model.render]
    ])
  }
}

export class ItemModel {

  constructor(public render: RenderObject, public display: Display = new Display()) {
    this.render = render
  }

  static fromJson(json: any): ItemModel {
    return new ItemModel(new RenderObject(json.cubes.map((cube: any) => Cube.fromJson(cube))), Display.fromJson(json.display))
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
      model.render = json.elements.map((element: any) => Cube.resource(element, textures))
    }

    if (json.parent) {
      const parentLoc = Location.fromJson(json.parent)
      if (parentLoc.equals(Location.minecraft('builtin/entity'))) {
        console.log(`Item model of ${parentLoc} skipped, it is from 'builtin/entity'`)
      } else if (parentLoc.equals(Location.minecraft('item/generated'))) {
        model.render.cubes.push(...Object.keys(textures)
          .filter(layer => layer.indexOf('layer') === 0)
          .map(layer => {
            const cube = new Cube(
              new Pos3D(0.5, 0, 0.5),
              new Size3D(1, 0, 1)
            )
            const location = Location.fromJson(textures[layer].replace('/', '\\'))
            const texture = new Texture(location)
            texture.save(loader.renderFile('textures', location, 'png'), loader.resource('textures', Location.fromJson(textures[layer]), 'png')!)
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
              new Pos3D(0.5, 0, 0.5),
              new Size3D(1, 0, 1)
            )
            const location = Location.fromJson(textures[layer].replace('/', '\\'))
            const texture = new Texture(location)
            texture.save(loader.renderFile('textures', location, 'png'), loader.resource('textures', Location.fromJson(textures[layer]), 'png')!)
            cube.faces[0] = texture
            return cube
          })
        )
        model.display.add(Display.itemHandheld)
      } else {
        const parent = ItemModel.resource(loader.resourceJson('models', Location.fromJson(json.parent)), textures)
        model.render.cubes.push(...parent.render.cubes)
        model.display.add(parent.display)
      }
    }
    return model
  }

  toJson(location: Location): any {
    return {
      display: this.display.toJson(),
      render: path.join(loader.renderDir, 'items', `${location.toDir()}.json`)
    }
  }
}

export class DisplayConfig {

  constructor(readonly rotation: Rotation3D, readonly translation: Pos3D, readonly scale: Size3D) { }

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
    new DisplayConfig(Rotation3D.north(), new Pos3D(0, 0, 0), new Size3D(1, 1, 1)),
    new DisplayConfig(Rotation3D.south(), new Pos3D(0, 0, 0), new Size3D(1, 1, 1))
  )

  static readonly itemHandheld = new Display(
    new DisplayConfig(Rotation3D.north(), new Pos3D(0, 0, 0), new Size3D(1, 1, 1)),
    new DisplayConfig(Rotation3D.south(), new Pos3D(0, 0, 0), new Size3D(1, 1, 1))
  )

  constructor(public gui?: DisplayConfig, public fixed?: DisplayConfig) { }

  static fromJson(json: Record<string, any>): Display {
    return new Display(DisplayConfig.fromJson(json.gui), DisplayConfig.fromJson(json.fixed))
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