export type FormDataInput = {
    id?: string,
    name: string,
    type: string,
    options?: any,
    value?: any
}

export type FormDataOutput = Record<string, any>

export type SceneObject = {
    position: number[],
    size?: number[],
    rotation?: number[],

    models: string[]
}

export function displayName(name: string): string {
    return name.charAt(0).toLocaleUpperCase() + name.substring(1).replace('_', ' ')
}

export class RelativeNumber {

    constructor(
        public value: number,
        public isRelative: boolean = false
    ) { }

    static fromJson(json: string): RelativeNumber {
        return json.charAt(json.length -1) === '%' ? new RelativeNumber(Number(json.substring(0, json.length -1)), true) : new RelativeNumber(Number(json))
    }

    get(dimension: number) {
        return this.isRelative ? this.value * dimension : this.value
    }

    toJson(): string {
        return `${this.value}${this.isRelative ? '%' : ''}`
    }

    toString(): string {
        return this.toJson()
    }
}