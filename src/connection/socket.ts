import { Socket } from "net";

export class SocketClient {

    protected messageIndex: number = 0
    protected waitingRequests: Map<number, (buffer: Buffer) => void> = new Map()

    protected constructor(
        readonly socket: Socket = new Socket(),
        readonly messages: Record<number, (buffer: Buffer, id: number) => void>
    ) { }

    static connect(port: number, identity: number, messages: Record<number, (buffer: Buffer, id: number) => void>, host: string = '127.0.0.1'): Promise<SocketClient> {
        return new Promise((resolve) => {
            let client = new SocketClient(new Socket(), messages)

            let messageLength: number = -1
            let receivedBytes: number
            let receivedBuffer: Buffer<ArrayBuffer>

            client.socket.on('data', (data) => {
                try {
                    if (messageLength === -1) {
                        messageLength = data.readUInt32BE(0)
                        receivedBytes = 0
                        receivedBuffer = Buffer.alloc(messageLength)
                    }

                    data.copy(receivedBuffer, receivedBytes)
                    receivedBytes += data.length

                    if (receivedBytes >= messageLength) {
                        const messageId = receivedBuffer.readUInt8(4)
                        const messageIndex = receivedBuffer.readInt32BE(5)
                        if (messageId === 0) {
                            const resolveRequest = client.waitingRequests.get(messageIndex)
                            if (resolveRequest) {
                                resolveRequest(receivedBuffer.subarray(9))
                                client.waitingRequests.delete(messageIndex)
                            } else {
                                console.warn(`No waiting request for TPC Client on port ${port} for message index ${messageIndex}`)
                            }
                        } else {
                            const message = messages[messageId]
                            if (message) {
                                message(receivedBuffer.subarray(9), messageIndex)
                            } else {
                                console.warn(`Invalid message id for TPC Client on port ${port} [${messageId}]`)
                            }
                        }
                        messageLength = -1
                    }
                } catch (err) {
                    console.error(`Error in TPC Client on port ${port}: ${err}`)
                }
            })

            client.socket.connect(port, host, () => {
                console.info(`Connected to TPC Server on port ${port}`)

                client.request(identity, Buffer.from([])).then((buffer) => {
                    if (buffer.readUInt8(0) === 1) {
                        console.info(`Identification accepted for TPC client ${port}`)
                    } else {
                        console.error(`Refused identification for TPC client ${port}`)
                    }
                    resolve(client)
                })
            })
            client.socket.on('close', () => console.info(`Closed TPC Connection with port ${port}`))
        })
    }

    protected writeToServer(messageId: number, messageIndex: number, buffer: Buffer) {
        const bufferToSend = Buffer.alloc(9 + buffer.length)
        bufferToSend.writeUInt32BE(bufferToSend.length, 0)
        bufferToSend.writeUInt8(messageId, 4)
        bufferToSend.writeInt32BE(messageIndex, 5)
        buffer.copy(bufferToSend, 9)
        this.socket.write(bufferToSend)
    }

    respond(messageIndex: number, buffer: Buffer) {
        this.writeToServer(0, messageIndex, buffer)
    }

    send(messageId: number, buffer: Buffer) {
        this.messageIndex++
        this.writeToServer(messageId, this.messageIndex - 1, buffer)
    }

    request(messageId: number, buffer: Buffer): Promise<Buffer> {
        return new Promise((resolve) => {
            this.messageIndex++
            this.writeToServer(messageId, this.messageIndex - 1, buffer)
            this.waitingRequests.set(this.messageIndex - 1, resolve)
        })
    }

    close(err?: Error) {
        this.socket.destroy(err)
    }
}