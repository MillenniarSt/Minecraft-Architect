import { Location } from "../../elements/element.js"
import { OnMessage, WsActions } from "../../socket.js"
import { FormDataOutput } from "../../util.js"
import { Dimension3D, Pos3D, Size3D } from "../../world/world3D.js"
import { BlockElement } from "../elements/block.js"
import { BuilderElement, BuilderElementNode, BuilderElementUpdate, BuilderElementUpdates, ElementView } from "../elements/elements.js"
import { BuilderElementGroup, elementsType } from "../elements/group.js"

export class Schematic {

    public dimension: Dimension3D

    private elements: BuilderElement[]
    private elementsMap: Map<string, { element: BuilderElement, parent: string | null }>

    constructor(dimension: Dimension3D, elements: BuilderElement[] = []) {
        this.dimension = dimension
        this.elements = elements
        this.elementsMap = new Map(this.buildMap(elements, null))
    }

    buildMap(elements: BuilderElement[], parent: string | null): [string, { element: BuilderElement, parent: string | null }][] {
        let entries: [string, { element: BuilderElement, parent: string | null }][] = []
        elements.forEach((element) => {
            entries.push([element.id, { element, parent }], ...(element.children ? this.buildMap(element.children, element.id) : []))

        })
        return entries
    }

    static fromJson(json: any): Schematic {
        return new Schematic(Dimension3D.fromJson(json.dimension), json.elements.map((element: any) => elementsType[element.type](element)))
    }

    tree(): BuilderElementNode[] {
        return this.elements.map((element) => element.node())
    }

    getSelectionData(ids: string[]): BuilderElementUpdates {
        return this.getById(ids[0]).select(ids.slice(1).map((id) => this.getById(id)))
    }

    updateForm(ids: string[], updates: FormDataOutput): BuilderElementUpdates {
        return this.getById(ids[0]).updateForm(updates, () => this.toJson())
    }

    pushElements(elements: BuilderElement[], parent?: string): BuilderElementUpdates {
        this.buildMap(elements, parent ?? null).forEach((entry) => this.elementsMap.set(entry[0], entry[1]))
        if (parent) {
            return this.getById(parent).push(elements, () => this.toJson())
        } else {
            this.elements.push(...elements)

            let updates: BuilderElementUpdate[] = []
            updates.push(...(parent ? this.getById(parent).view() : this.view().elements).map((el) => {
                return {
                    id: el.id,
                    mode: 'push',
                    view: el
                } as BuilderElementUpdate
            }))
            if(parent) {
                updates.push({
                    id: parent,
                    mode: 'push',
                    node: this.getById(parent).node()
                })
            } else {
                elements.forEach((element) => updates.push({
                    id: element.id,
                    mode: 'push',
                    node: element.node()
                }))
            }

            return {
                file: this.toJson(),
                updates: updates
            }
        }
    }

    deleteElements(ids: string[]): BuilderElementUpdates {
        ids.forEach((id) => {
            const parent = this.getParentOf(id)
            if (parent) {
                parent.children.splice(parent.children.findIndex((child) => child.id === id), 1)
            } else if (parent === null) {
                this.elements.splice(this.elements.findIndex((element) => element.id === id), 1)
            }
            if (parent !== undefined) {
                const recursiveDelete = (element: BuilderElement) => {
                    this.elementsMap.delete(element.id)
                    element.children.forEach((child) => recursiveDelete(child))
                }
                recursiveDelete(this.getById(id))
            }
        })
        return {
            file: this.toJson(),
            updates: ids.map((id) => {
                return {
                    id: id,
                    mode: 'delete'
                }
            })
        }
    }

    moveElements(ids: string[], parent?: string): BuilderElementUpdates {
        const elements = ids.map((id) => this.getById(id))
        this.deleteElements(ids)
        this.pushElements(elements, parent)

        let updates: BuilderElementUpdate[] = []
        updates.push(...elements.map((element) => {
            return {
                id: element.id,
                parent: parent ?? null
            }
        }))
        updates.push(...(parent ? this.getById(parent).view() : this.view().elements).map((el) => {
            return {
                id: el.id,
                view: el
            } as BuilderElementUpdate
        }))
        return {
            file: this.toJson(),
            updates: updates
        }
    }

    view(): { elements: ElementView[] } {
        let elements: ElementView[] = []
        this.elements.forEach((element) => {
            elements.push(...element.view())
        })
        return {
            elements: elements
        }
    }

    toJson(): {} {
        return {
            dimension: this.dimension.toJSON(),
            elements: this.elements.map((element) => element.toJson())
        }
    }

    getById(id: string): BuilderElement {
        return this.elementsMap.get(id)!.element
    }

    getParentOf(id: string): BuilderElement | null | undefined {
        const data = this.elementsMap.get(id)
        if (data) {
            return data.parent ? this.getById(data.parent) : null
        }
        return undefined
    }
}

let opened: Map<string, Schematic> = new Map()

export function registerSchematicMessages(messages: OnMessage) {
    messages.set('data-pack/schematics/new', (data, ws) => ws.respond(new Schematic(new Dimension3D(Pos3D.ZERO, new Size3D(5, 5, 5))).toJson()))

    messages.set('data-pack/schematics/open', (data, ws) => {
        const schematic = Schematic.fromJson(data.data)
        opened.set(data.path, schematic)
        ws.respond({
            nodes: schematic.tree(),
            view: schematic.view()
        })
    })
    messages.set('data-pack/schematics/close', (data) => opened.delete(data))

    messages.set('data-pack/schematics/view', (data, ws) => ensureSchematic(data.path, ws, (schematic) => ws.respond(schematic.view())))
    messages.set('data-pack/schematics/tree', (data, ws) => ensureSchematic(data.path, ws, (schematic) => ws.respond(schematic.tree())))

    messages.set('data-pack/schematics/new-elements', (data, ws) => ensureSchematic(data.path, ws, (schematic) =>
        schematic.pushElements([new BlockElement(Pos3D.ZERO, Location.minecraft('oak_planks'), {})], data.parent)
    ))
    messages.set('data-pack/schematics/delete-elements', (data, ws) => ensureSchematic(data.path, ws, (schematic) => schematic.deleteElements(data.ids)))
    messages.set('data-pack/schematics/move-elements', (data, ws) => ensureSchematic(data.path, ws, (schematic) =>
        schematic.moveElements(data.ids, data.parent)
    ))
    messages.set('data-pack/schematics/in-group', (data, ws) => ensureSchematic(data.path, ws, (schematic) => {
        const group = BuilderElementGroup.generate('Group', data.ids.map((id: string) => schematic.getById(id)))
        group.children = []
        schematic.pushElements([group], schematic.getParentOf(data.in)?.id)
        const moveUpdate = schematic.moveElements(data.ids, group.id)
        return {
            file: schematic.toJson(),
            updates: [...moveUpdate.updates ?? [], {
                id: group.id,
                mode: 'push',
                node: group.node()
            }]
        }
    }))

    messages.set('data-pack/schematics/selection', (data, ws) => ensureSchematic(data.path, ws, (schematic) =>
        ws.respond(schematic.getSelectionData(data.selection).client ?? {})
    ))
    messages.set('data-pack/schematics/update-form', (data, ws) => ensureSchematic(data.path, ws, (schematic) =>
        schematic.updateForm(data.selection, data.updates)
    ))
}

function ensureSchematic(path: string, ws: WsActions, then: (schematic: Schematic) => BuilderElementUpdates | void) {
    const schematic = opened.get(path)
    if (schematic) {
        const update = then(schematic)
        if (update) {
            if (update.updates) {
                ws.sendAll('data-pack/schematics/update', { path: path, updates: update.updates })
            }
            if(update.client) {
                ws.send('data-pack/schematics/update-client', { path: path, form: update.client.form, editGraph: update.client.editGraph })
            }
            if (update.file) {
                ws.send('data-pack/schematics/update-file', { path: path, file: update.file })
            }
        }
    } else {
        throw new Error(`Fail to render schematic '${path}', it does not exists or it is not opened`)
    }
}