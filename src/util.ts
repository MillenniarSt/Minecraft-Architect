export type FormDataInput = {
    id?: string,
    name: string,
    type: string,
    options?: any,
    value?: any
}

export type FormDataOutput = Record<string, any>

export type SceneEdit = {
    modes: {
        move?: [number, number, number],
        resize?: [number, number, number],
        rotate?: [number, number, number]
    },
    center?: [number, number, number]
}

export function displayName(name: string): string {
    return name.charAt(0).toLocaleUpperCase() + name.substring(1).replace('_', ' ')
}