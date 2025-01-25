import { BlockType } from "../register/block.js";

export class Block {

    constructor(
        readonly type: BlockType,
        public blockstate: number
    ) { }
}