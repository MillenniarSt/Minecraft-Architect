import { Location } from "../elements/element.js"
import { loader } from "../elements/loader.js"
import { Pos3D } from "../world/world3D.js"

export type SchematicBlock = {
    pos: Pos3D,
    location?: Location,
    properties: Record<string, any>
}

export type SchematicJson = {
    blocks: {
        pos: number[],
        location?: string,
        properties: Record<string, any>
    }[]
}

export type SchematicBuilt = {
    objects: {
        models: {
            position: Pos3D,
            key: string
        }[]
    }[]
}

export class Schematic {

    blocks: SchematicBlock[]

    constructor(blocks: SchematicBlock[] = []) {
        this.blocks = blocks
    }

    static fromJson(json: SchematicJson): Schematic {
        return new Schematic(json.blocks.map((block) => {
            return {
                pos: Pos3D.fromJson(block.pos),
                location: block.location ? Location.fromJson(block.location) : undefined,
                properties: block.properties
            }
        }))
    }

    build(): SchematicBuilt {
        let objects: {
            models: {
                position: Pos3D,
                key: string
            }[]
        }[] = []

        this.blocks.forEach((schemBlock) => {
            if(schemBlock.location) {
                const blockstate = loader.blocks.get(schemBlock.location.toString())
                if(blockstate) {
                    const models = blockstate.model(schemBlock.properties) ?? [0, 0]
                    objects.push({
                        models: models.map(([i, j]) => {
                            return {
                                position: schemBlock.pos,
                                key: `${schemBlock.location!.toString()}-${i}-${j}`
                            }
                        })
                    })
                } else {
                    objects.push({
                        models: [{
                            position: schemBlock.pos,
                            key: 'minecraft:undefined'
                        }]
                    })
                }
            } 
        })

        return {
            objects
        }
    }

    toJson(): SchematicJson {
        return {
            blocks: this.blocks.map((block) => {
                return {
                    pos: block.pos.toJSON(),
                    location: block.location?.toJson(),
                    properties: block.properties
                }
            })
        }
    }
}