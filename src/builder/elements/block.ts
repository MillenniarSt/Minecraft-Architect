import { v4 } from "uuid"
import { displayName, FormDataInput, FormDataOutput } from "../../util.js"
import { Dimension3D, Pos3D, Size3D } from "../../world/world3D.js"
import { Location } from "../../minecraft/objects/object.js"
import { loader } from "../../minecraft/loader.js"
import { Anchor, BuilderElement, BuilderElementNode, BuilderElementUpdates, EditGraph, ElementView } from "./elements.js"
import { Block } from "../../minecraft/objects/block.js"

export class BlockElement extends BuilderElement {

    constructor(
        public position: Pos3D,
        public _location: Location | undefined,
        public properties: Record<string, string> = {},
        anchor: Anchor = new Anchor(),
        id?: string
    ) {
        super(id ?? v4(), [], undefined, undefined, anchor)
    }

    static fromJson(json: any): BlockElement {
        return new BlockElement(Pos3D.fromJson(json.pos), Location.fromJson(json.location), json.properties, Anchor.fromJson(json.anchor), json.id)
    }

    get dimension(): Dimension3D {
        return new Dimension3D(this.position, Size3D.UNIT)
    }

    set dimension(dimension: Dimension3D) {
        this.position = dimension.pos
    }

    node(): BuilderElementNode {
        return {
            id: this.id,
            label: this.block.name,
        }
    }

    form(): FormDataInput[] {
        let blockForm: FormDataInput[] = [
            {
                id: 'location',
                name: 'Block',
                type: 'text',
                options: 'blocks',
                value: this.location?.toString()
            },
            {
                id: 'pos',
                name: 'Position',
                type: 'vec3',
                value: this.position.toJSON()
            }
        ]
        if (Object.entries(this.properties).length > 0) {
            const blockProperties = Object.entries(this.block.properties)
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
                    value: this.properties[property[0]]
                })
            })
        }
        return blockForm
    }

    editGraph(): EditGraph {
        return {
            modes: {
                move: [1, 1, 1]
            },
            dimension: this.dimension.toJSON()
        }
    }


    view(): ElementView[] {
        const models = this.block.model(this.properties) ?? [0, 0]
        return [{
            id: this.id,
            objects: [{
                position: this.position.toJSON(),
                models: models.map(([i, j]) => `${this.location!.toString()}-${i}-${j}`)
            }]
        }]
    }

    updateForm(updates: FormDataOutput, save: () => {}): BuilderElementUpdates {
        let updateForm = false
        let updateGraph = false
        let updateFile = false

        if(updates.pos && updates.pos !== this.position.toJSON()) {
            this.position = Pos3D.fromJson(updates.pos)
            updateFile = true
            updateGraph = true
        }

        Object.entries(updates).filter((property) => property[0].startsWith('p-')).forEach((property) => {
            const key = property[0].substring(2)
            if(this.properties[key] !== property[1]) {
                this.properties[key] = property[1]
                updateFile = true
            }
        })

        if (updates.location && updates.location !== this.location?.toString() && loader.blocks.has(updates.location)) {
            this.location = Location.fromJson(updates.location)
            updateForm = true
            updateFile = true
        }

        return {
            file: updateFile ? save() : undefined,
            updates: [{
                id: this.id,
                form: updateForm,
                view: this.view()[0],
                node: this.node(),
                editGraph: updateGraph
            }]
        }
    }

    push(elements: BuilderElement[], save: () => {}): BuilderElementUpdates {
        return {}
    }

    get block(): Block {
        let block: Block | undefined
        if (this.location) {
            block = loader.blocks.get(this.location.toString())
        }
        return block ?? loader.blocks.get('minecraft:undefined')!
    }

    get location(): Location | undefined {
        return this._location
    }

    set location(location: Location) {
        this._location = location
        this.checkProperties()
    }

    checkProperties() {
        this.properties = Object.fromEntries(Object.entries(this.block.properties).map((property) => [property[0], this.properties[property[0]] ?? property[1][0]]))
    }

    toJson(): {} {
        return {
            id: this.id,
            type: 'block',
            pos: this.position.toJSON(),
            location: this.location?.toJson(),
            properties: this.properties,
            anchor: this.anchor.toJson()
        }
    }
}