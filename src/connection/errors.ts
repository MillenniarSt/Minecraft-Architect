import { WebSocketError } from "./socket.js"

export abstract class ServerProblem extends Error {

    severity: 'warn' | 'error' | 'fatal' = 'error'

    abstract print(): string

    abstract toSocketError(): WebSocketError

    warn() {
        this.severity = 'warn'
    }

    fatal() {
        this.severity = 'fatal'
    }
}

export class InternalServerError extends ServerProblem {

    print(): string {
        return `${this.name}: ${this.message}`
    }

    toSocketError(): WebSocketError {
        return {
            severity: this.severity,
            name: this.name,
            message: this.message,
            stack: this.stack
        }
    }
}

// Utils error classes

export class IdNotExists extends InternalServerError {

    constructor(readonly id: string, ...context: string[]) {
        super(`Id [${id}] does not exists in ${context.join('/')}`)
    }
}

export class IdAlreadyExists extends InternalServerError {

    constructor(readonly id: string, ...context: string[]) {
        super(`Id [${id}] already exists in ${context.join('/')}`)
    }
}

export class NameNotRegistered extends InternalServerError {

    constructor(readonly name: string, ...context: string[]) {
        super(`Name '${name}' is not registered in ${context.join('/')}`)
    }
}