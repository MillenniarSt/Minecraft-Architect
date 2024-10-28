import { v4 } from "uuid"
import { Location } from "../elements/element.js"
import { loader } from "../elements/loader.js"
import { displayName, FormDataInput, FormDataOutput, SceneEdit } from "../util.js"
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
    objects: SchematicBlockBuilt[]
}

export type SchematicBlockBuilt = {
    position: Pos3D,
    id: string,
    models: string[]
}

export class Schematic {

    blocks: Map<string, SchematicBlock>

    constructor(blocks: SchematicBlock[] = []) {
        this.blocks = new Map(blocks.map((block) => [v4(), block]))
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

    getBlockProperties(id: string): {
        form: FormDataInput[],
        sceneEdit: SceneEdit
    } {
        const block = this.blocks.get(id)
        if (block) {
            let blockForm: FormDataInput[] = [
                {
                    id: 'location',
                    name: 'Block',
                    type: 'text',
                    options: 'blocks',
                    value: block.location?.toString()
                },
                {
                    id: 'pos',
                    name: 'Position',
                    type: 'vec3',
                    value: block.pos.toJSON()
                }
            ]
            if (Object.entries(block.properties).length > 0) {
                const blockProperties = Object.entries(loader.blocks.get(block.location!.toString())!.properties)
                blockForm.push({
                    name: 'Properties',
                    type: 'separator'
                })
                blockProperties.forEach((property) => {
                    blockForm.push({
                        id: `p-${property[0]}`,
                        name: displayName(property[0]),
                        type: 'select',
                        options: property[1].map((p) => {
                            return { value: p, label: displayName(p) }
                        }),
                        value: block.properties[property[0]]
                    })
                })
            }
            return {
                form: blockForm,
                sceneEdit: {
                    modes: {
                        move: [1, 1, 1],
                    },
                    center: block.pos.plus(new Pos3D(0.5, 0.5, 0.5)).toJSON() as [number, number, number]
                }
            }
        } else {
            console.log(`Could not find schematic block with id: ${id}`)
            return {
                form: [],
                sceneEdit: { modes: {} }
            }
        }
    }

    updateBlock(id: string, changes: FormDataOutput): {
        file?: {},
        form?: FormDataInput[],
        sceneEdit?: SceneEdit
        render?: { id: string, object: SchematicBlockBuilt }[]
    } {
        const block = this.blocks.get(id)
        if (block) {
            let updateForm = false

            block.pos = Pos3D.fromJson(changes.pos)

            if (changes.location !== block.location?.toString()) {
                block.location = Location.fromJson(changes.location)
                updateForm = true
            }

            block.properties = Object.fromEntries(Object.entries(changes).filter((property) => property[0].startsWith('p-')).map((property) => [property[0].substring(2), property[1]]))

            const blockProperties = updateForm ? this.getBlockProperties(id) : undefined
            return {
                file: this.toJson(),
                form: blockProperties?.form,
                sceneEdit: blockProperties?.sceneEdit,
                render: [{ id: id, object: this.buildBlock(id, block) }]
            }
        } else {
            console.log(`Could not find schematic block with id: ${id}`)
            return {}
        }
    }

    build(): SchematicBuilt {
        let objects: SchematicBlockBuilt[] = []

        this.blocks.forEach((block, id) => {
            objects.push(this.buildBlock(id, block))
        })

        return {
            objects: objects
        }
    }

    buildBlock(id: string, schemBlock: SchematicBlock): SchematicBlockBuilt {
        if (schemBlock.location) {
            const blockstate = loader.blocks.get(schemBlock.location.toString())
            if (blockstate) {
                const models = blockstate.model(schemBlock.properties) ?? [0, 0]
                return {
                    position: schemBlock.pos,
                    id: id,
                    models: models.map(([i, j]) => `${schemBlock.location!.toString()}-${i}-${j}`)
                }
            }
        }

        return {
            position: schemBlock.pos,
            id: id,
            models: ['minecraft:undefined']
        }
    }

    toJson(): SchematicJson {
        let blocks: {
            pos: number[]
            location?: string
            properties: Record<string, any>
        }[] = []

        this.blocks.forEach((block) => {
            blocks.push({
                pos: block.pos.toJSON(),
                location: block.location?.toJson(),
                properties: block.properties
            })
        })

        return {
            blocks: blocks
        }
    }
}