import { Item } from "../register/item.js";

export class ItemStack {

    constructor(
        readonly item: Item,
        public count: number
    ) { }
}