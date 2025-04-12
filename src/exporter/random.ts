import { IdNotExists } from "../connection/errors"
import { OnMessage } from "../connection/socket"
import { loader } from "../minecraft/loader"

export class Seed {

    public seed: number

    constructor(seed: number = Math.floor(Math.random() * 2147483647)) {
        this.seed = seed % 2147483647
        if (this.seed <= 0) {
            this.seed += 2147483646
        }
    }

    next(): number {
        this.seed = (this.seed * 16807) % 2147483647
        return (this.seed - 1) / 2147483646
    }
}

const randomTypes: Record<string, RandomType> = {}

export abstract class RandomType<T = any, R = any> {

    constructor(
        readonly id: string,
        readonly defaultValue: T
    ) { }

    abstract get(value: T): R

    abstract randoms(): Record<string, any>

    static get(id: string): RandomType {
        return randomTypes[id]
    }

    static register(type: RandomType) {
        randomTypes[type.id] = type
    }
}

export class RandomEnumType<R = any> extends RandomType<string, R> {

    constructor(
        id: string,
        defaultValue: string,
        readonly get: (value: string) => R
    ) {
        super(id, defaultValue)
    }

    randoms(): Record<string, any> {
        return {
            generic: { name: 'RandomEnum', data: [{ id: this.defaultValue, weight: 1 }] }
        }
    }
}

export const randomMaterialType = new RandomEnumType('block', 'minecraft:stone_bricks', (value) => {
    const block = loader.blocks.get(value)
    if(!block)
        throw new IdNotExists(value, 'Block')
    return block
})

RandomType.register(randomMaterialType)

export function registerRandomMessages(messages: OnMessage) {
    messages.set('random/get-types', async (data, side, id) => {
        side.respond(id, Object.entries(randomTypes).map(([key, type]) => {
            return { id: key, constant: type.defaultValue, randoms: type.randoms() }
        }))
    })
}