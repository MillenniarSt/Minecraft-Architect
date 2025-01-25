//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import { OnMessage, WsActions } from "../socket.js";
import { Dimension3D } from "../world/world3D.js";
import { BlockElement } from "./block.js";
import { BuilderElement, BuilderElementUpdateData } from "./elements.js";

export function registerElementsMessages(messages: OnMessage) {
    messages.set('elements/init', (data, ws) => getElement(data.element, ws, (element) => 
        element.getData()
    ))

    messages.set('elements/set-dimension', (data, ws) => getElement(data.element, ws, (element) => {
        return element.setDimension(Dimension3D.fromJson(data.dimension))
    }))
    messages.set('elements/form', (data, ws) => getElement(data.element, ws, (element) => {
        ws.respond(element.form())
    }))
    messages.set('elements/edit-graph', (data, ws) => getElement(data.element, ws, (element) => {
        ws.respond(element.editGraph())
    }))

    messages.set('elements/update-form', (data, ws) => getElement(data.element, ws, (element) => {
        return element.updateForm(data.updates)
    }))
}

function getElement(data: any, ws: WsActions, then: (element: BuilderElement) => BuilderElementUpdateData | void) {
    const build = elementsShapes[data.shape]
    if(build) {
        const update = then(build(data))
        if(update) {
            ws.respond(update)
        }
    } else {
        throw new Error(`Invalid element shape: ${data.shape}`)
    }
}

/**
 * Register here all builder elements
 */
export const elementsShapes: Record<string, (json: any) => BuilderElement> = {
    block: BlockElement.fromJson
}