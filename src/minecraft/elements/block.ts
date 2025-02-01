import { loader } from "../loader.js";
import { BlockState, BlockType } from "../register/block.js";

export class Block {

    constructor(
        public state: BlockState,
        public nbt?: {}
    ) { }

    getType(): BlockType {
        return loader.blocks.get(this.state.block.toString())!
    }
}