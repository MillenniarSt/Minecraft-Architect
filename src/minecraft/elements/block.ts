//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { getProject } from "../../project.js";
import { BlockState, BlockType } from "../register/block.js";

export class Block {

    constructor(
        public state: BlockState,
        public nbt?: {}
    ) { }

    getType(): BlockType {
        return getProject().loader.getBlock(this.state.block.toString())!
    }

    toString(): string {
        return this.state.block.toString()
    }
}