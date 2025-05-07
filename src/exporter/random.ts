import { OnMessage } from "../connection/socket"
import { BlockType } from "../minecraft/register/block"
import { Item } from "../minecraft/register/item"
import { getProject } from "../project"

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

const RANDOM_TYPES: Record<string, RandomType> = {}

export type RandomCollectionItem<V = any> = { icon?: string, piIcon?: string, label: string, code: V }

export class RandomType<T = any, R = any> {

    constructor(
        readonly id: string,
        readonly constant: string,
        readonly randoms: string[],
        readonly get: (value: T) => R,
        readonly defaultValue: T,
        readonly collection: RandomCollectionItem<T>[]
    ) { }

    static get(id: string): RandomType {
        return RANDOM_TYPES[id]
    }

    static register<T = any, R = any>(type: RandomType<T, R>): RandomType<T, R> {
        RANDOM_TYPES[type.id] = type
        return type
    }
}

export let BLOCK_RANDOM: RandomType<string, BlockType>
export let ITEM_RANDOM: RandomType<string, Item>

export function registerRandoms() {
    BLOCK_RANDOM = RandomType.register(new RandomType('block', 'c_enum', ['enum'], getProject().loader.getBlock, 'minecraft:stone_bricks', getProject().loader.getAllBlocks().map((block) => {
        return { icon: block.icon, label: block.name, code: block.location.toString() }
    })))
    ITEM_RANDOM = RandomType.register(new RandomType('item', 'c_enum', ['enum'], getProject().loader.getItem, 'minecraft:diamond', getProject().loader.getAllItems().map((item) => {
        return { icon: item.icon, label: item.name, code: item.location.toString() }
    })))
}

export function registerRandomMessages(messages: OnMessage) {
    messages.set('random/get-types', async (data, side, id) => {
        side.respond(id, Object.values(RANDOM_TYPES).map((type) => {
            return { id: type.id, constant: type.constant, randoms: type.randoms, defaultValue: type.defaultValue, collection: type.collection }
        }))
    })
}