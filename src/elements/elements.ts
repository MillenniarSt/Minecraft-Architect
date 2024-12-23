import { FormDataInput, FormDataOutput, SceneObject } from "../util.js"
import { Dimension3D, Pos3D } from "../world/world3D.js"

export type BuilderElementUpdateData = {
    data?: {},

    dimension?: { pos: number[], size: number[] },
    label?: string,
    children?: BuilderElementNode[],
    view?: ElementView,

    update?: BuilderElementUpdate
}

export type BuilderElementUpdate = {
    view?: ElementView,
    node?: BuilderElementNode,
    editGraph?: boolean,
    form?: boolean
}

export type ElementView = {
    id: string,
    objects: SceneObject[],
    children?: ElementView[]
}

export type BuilderElementNode = {
    id: string,
    label: string,
    isGroup?: boolean,
    children?: BuilderElementNode[]
}

export type EditGraph = {
    modes: {
        move?: [number, number, number],
        resize?: [number, number, number],
        rotate?: [number, number, number]
    },
    dimension?: { pos: number[], size: number[] }
}

export abstract class BuilderElement {

    constructor(
        readonly id: string,
        public pos: Pos3D
    ) { }

    getData(): BuilderElementUpdateData {
        const node = this.node()
        return {
            dimension: this.getDimension().toJSON(),
            label: node.label,
            children: node.children,
            view: this.view()
        }
    }

    abstract getDimension(): Dimension3D

    abstract node(): BuilderElementNode

    abstract form(): FormDataInput[]

    abstract editGraph(): EditGraph

    abstract view(): ElementView


    abstract setDimension(dimension: Dimension3D): BuilderElementUpdateData

    abstract updateForm(updates: FormDataOutput): BuilderElementUpdateData


    abstract get data(): {}
}