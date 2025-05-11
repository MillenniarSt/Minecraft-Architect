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

import { Registry } from './registry.js'
import { Item } from './item.js'
import { Cube, RenderObject } from '../render.js'
import path from 'path'
import { Quaternion } from '../../world/quaternion.js'
import { Vec3 } from '../../world/vector.js'
import { getProject } from '../../project.js'
import { Location } from "../location.js"

export class BlockType extends Registry {

  item?: Item
  multipart: boolean
  blockstates: BlockState[]

  properties: Record<string, string[]>

  constructor(location: Location, item: Item | undefined, multipart: boolean, blockstates: BlockState[], properties: Record<string, string[]> = {}) {
    super(location)
    this.item = item
    this.multipart = multipart
    this.blockstates = blockstates
    this.properties = properties
  }

  static fromJson(location: Location, json: any): BlockType {
    const itemLoc = json.item ? Location.fromJson(json.item) : undefined
    return new BlockType(
      location,
      json.multipart, 
      json.states[0]?.addictionable === true, 
      json.states.map((blocstate: any) => BlockState.fromJson(blocstate, location)),
      json.properties
    )
  }

  toJson(): { [key: string]: any } {
    return {
      item: this.item?.location.toJson(),
      multipart: this.multipart,
      states: this.blockstates.map((blocstate, i) => blocstate.toJson(this.location, i)),
      properties: this.properties
    }
  }

  static resource(location: Location, json: any): BlockType {
    const multipart = json.multipart !== undefined
    let blockstates
    let item

    if (multipart) {
      blockstates = json.multipart.map((part: any) => BlockState.resource(part.apply, location, part.when))
    } else {
      blockstates = Object.keys(json.variants).map((condition) => BlockState.resource(json.variants[condition], location, condition))
    }
    const itemJson = getProject().loader.resourceJson('models/item', location)
    if (itemJson) {
      item = Item.resource(location, itemJson)
    }

    const block = new BlockType(location, item, multipart, blockstates)
    block.buildProperties()
    return block
  }

  defaultRender(): RenderObject {
    return this.blockstates[0].models[0].render
  }

  secondRender(): RenderObject | undefined {
    return this.item?.defaultRender()
  }

  model(conditions: Condition | Record<string, string>): [number, number][] {
    let indexes: [number, number][] = []

    if (this.multipart) {
      this.blockstates.forEach((blockstate, i) => {
        if(blockstate.condition.equals(conditions)) {
          indexes.push([i, Math.floor(Math.random() * blockstate.models.length)])
        }
      })
    } else {
      this.blockstates.forEach((blockstate, i) => {
        if(blockstate.condition.equals(conditions)) {
          indexes = [[i, Math.floor(Math.random() * blockstate.models.length)]]
        }
      })
    }

    return indexes
  }

  buildProperties() {
    this.properties = {}
    this.blockstates.forEach((blockstate) => {
      Object.entries(blockstate.condition.conditions).forEach((property) => {
        if(this.properties[property[0]] === undefined) {
          this.properties[property[0]] = [property[1]]
        } else if(!this.properties[property[0]].includes(property[1])) {
          this.properties[property[0]].push(property[1])
        }
      }) 
    })
  }

  get path(): string {
    return getProject().loader.dataFile("block", this.location, "json")
  }

  save(): void {
    super.save()

    if(this.item) {
      this.item.save()
    }
  }

  renderToSave(): Record<string, RenderObject> {
    let renders: [string, RenderObject][] = []

    this.blockstates.forEach((blockstate, i) => {
       blockstate.models.forEach((model, j) => {
        renders.push([path.join(getProject().renderDir, 'blocks', `${this.location.toDir()}-${i}-${j}.json`), model.render])
       })
    })

    if(this.item) {
      renders.push(...Object.entries(this.item.renderToSave()))
    }

    return Object.fromEntries(renders)
  }
}

export class BlockState {
  
  constructor(readonly block: Location, readonly models: BlockModel[], readonly condition: Condition = Condition.all()) { }

  static resource(models: any, block: Location, condition: any): BlockState {
    return new BlockState(
      block,
      Array.isArray(models)
        ? models.map((model: any) => BlockModel.resource(getProject().loader.resourceJson('models', Location.fromJson(model.model)), {}, Quaternion.fromAxisAngle(new Vec3(model.x, model.y, model.z), 0)))
        : [BlockModel.resource(getProject().loader.resourceJson('models', Location.fromJson(models['model'])), {}, Quaternion.fromAxisAngle(new Vec3(models.x, models.y, models.z), 0))],
      Condition.resource(condition)
    )
  }

  static fromJson(json: any, block: Location): BlockState {
    return new BlockState(block, json.models.map((model: any) => new BlockModel(model)), Condition.fromJson(json.condition))
  }

  toJson(location: Location, blockstate: number): {} {
    return {
      condition: this.condition.toJson(),
      models: this.models.map((model, i) => model.toJson(location, blockstate, i))
    }
  }
}

export class Condition {

  constructor(readonly conditions: Record<string, string>) { }

  static all(): Condition {
    return new Condition({})
  }

  static fromJson(json: any): Condition {
    return new Condition(json)
  }

  static resource(json: any): Condition {
    if (typeof json === 'string' && json.length > 0) {
      return new Condition(Object.fromEntries(
        json.split(',').map(condition => {
          const [key, value] = condition.split('=')
          return [key, value]
        })
      ))
    } else if (typeof json === 'object') {
      return new Condition(json)
    } else {
      return new Condition({})
    }
  }

  toJson(): any {
    return this.conditions
  }

  equals(other: Condition | Record<string, string>): boolean {
    const conditions = other instanceof Condition ? other.conditions : other
    return Object.entries(this.conditions).every(([key, value]) => 
      conditions[key] && conditions[key].toString() === value.toString()
    )
  }
}

export class BlockModel {

  constructor(readonly render: RenderObject) { }

  static resource(json: any, pTextures: Record<string, string>, rotation?: Quaternion): BlockModel {
    let cubes: Cube[] = []

    const textures = {
      ...(json.textures && Object.fromEntries(
        Object.keys(json.textures).map((key) => {
          const value = json.textures[key]
          return [
            key,
            (value as string)[0] === '#' ? pTextures[(value as string).substring(1)] || json.textures[(value as string).substring(1)] : value
          ]
        })
      )),
      ...pTextures
    }

    if (json.elements) {
      cubes = json.elements.map((element: any) => Cube.resource(element, textures))
    }

    if (json.parent) {
      const parentModel = BlockModel.resource(getProject().loader.resourceJson('models', Location.fromJson(json.parent)), textures)
      cubes.push(...parentModel.render.cubes)
    }

    if(rotation) {
      cubes.forEach((cube) => cube.rotate(rotation))
    }

    return new BlockModel(new RenderObject(cubes))
  }

  static fromJson(json: any): BlockModel {
    return new BlockModel(RenderObject.fromFile(json.render))
  }

  toJson(location: Location, blockstate: number, index: number): any {
    return {
      render: path.join(getProject().renderDir, 'blocks', `${location.toDir()}-${blockstate}-${index}.json`)
    }
  }
}