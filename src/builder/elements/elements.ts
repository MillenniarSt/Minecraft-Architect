import { FormDataInput, FormDataOutput, SceneObject } from "../../util.js"
import { Dimension3D, Pos3D, Size3D } from "../../world/world3D.js"

export type BuilderElementUpdates = {
    file?: {},
    client?: {
        editGraph?: EditGraph,
        form?: FormDataInput[]
    }
    updates?: BuilderElementUpdate[]
}

export type BuilderElementUpdate = {
    id: string,
    mode?: 'push' | 'delete',
    parent?: string | null

    view?: ElementView,
    node?: BuilderElementNode,
    editGraph?: boolean,
    form?: boolean
}

export type ElementView = {
    id: string,
    objects: SceneObject[]
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
    center?: number[]
}

export abstract class BuilderElement {

    constructor(
        readonly id: string,
        public children: BuilderElement[],

        public minSize?: Size3D,
        public maxSize?: Size3D,
        public anchor: Anchor = new Anchor()
    ) { }

    abstract get dimension(): Dimension3D

    abstract set dimension(dimension: Dimension3D)

    abstract node(): BuilderElementNode

    abstract form(): FormDataInput[]

    abstract editGraph(): EditGraph

    abstract view(): ElementView[]


    abstract updateForm(updates: FormDataOutput, save: () => {}): BuilderElementUpdates

    abstract push(elements: BuilderElement[], save: () => {}): BuilderElementUpdates

    select(elements: BuilderElement[]): BuilderElementUpdates {
        return {
            client: {
                form: this.form(),
                editGraph: this.editGraph()
            }
        }
    }


    abstract toJson(): {}

    indexOfChild(id: string): number {
        return this.children.findIndex((child) => child.id === id)
    }
}

export enum AnchorAxis {
    RELATIVE = 'rel',
    RELATIVE_POS = 'rel_pos',
    ABSOLUTE_LEFT = 'abs_left',
    ABSOLUTE_RIGHT = 'abs_right',
    ABSOLUTE_FILL = 'abs_fill'
}

export class Anchor {

    constructor(
        public x: AnchorAxis = AnchorAxis.RELATIVE,
        public y: AnchorAxis = AnchorAxis.RELATIVE,
        public z: AnchorAxis = AnchorAxis.RELATIVE
    ) { }

    static fromJson(json: any[]): Anchor {
        return new Anchor(json[0], json[1], json[2])
    }

    update(from: Dimension3D, to: Dimension3D, value: Dimension3D): Dimension3D {
        const ux = this.updateAxisPos(this.x, [from.pos.x, from.size.width], [to.pos.x, to.size.width], [value.pos.x, value.size.width])
        const uy = this.updateAxisPos(this.y, [from.pos.y, from.size.height], [to.pos.y, to.size.height], [value.pos.y, value.size.height])
        const uz = this.updateAxisPos(this.z, [from.pos.z, from.size.length], [to.pos.z, to.size.length], [value.pos.z, value.size.length])

        return new Dimension3D(new Pos3D(ux[0], uy[0], uz[0]), new Size3D(ux[1], uy[1], uz[1]))
    }

    updateAxisPos(axis: AnchorAxis, from: [number, number], to: [number, number], value: [number, number]): [number, number] {
        switch (axis) {
            case AnchorAxis.RELATIVE:
                return [((value[0] - from[0]) * to[1] / from[1]) + to[0], value[1] * to[1] / from[1]]
            case AnchorAxis.RELATIVE_POS:
                return [((value[0] - from[0]) * to[1] / from[1]) + to[0], value[1]]
            case AnchorAxis.ABSOLUTE_LEFT:
                return [to[0] + (value[0] - from[0]), value[1]]
            case AnchorAxis.ABSOLUTE_RIGHT:
                return [to[0] + to[1] - (from[0] + from[1] - value[0] - value[1]), value[1]]
            case AnchorAxis.ABSOLUTE_FILL:
                return [to[0] + (value[0] - from[0]), to[1] - (value[0] - from[0]) - (from[0] + from[1] - value[0] - value[1])]
        }
    }

    toJson(): any[] {
        return [this.x, this.y, this.z]
    }
}