import fs from 'fs'
import Busboy from 'busboy'
import { pipeline } from 'stream/promises'
import { logger } from './logger.js'

export default class UploadHandler {
    constructor({ io, socketId, downloadsFolder, messageMilisecondsDelay = 200 }) {
        this.io = io
        this.socketId = socketId
        this.downloadsFolder = downloadsFolder
        this.ON_UPLOAD_EVENT = 'file-upload'
        this.messageMilisecondsDelay = messageMilisecondsDelay
    }

    canExecute(lastExecution) {
        return (Date.now() - lastExecution) > this.messageMilisecondsDelay
    }

    handleFileBuffer(filename) {
        this.lastMessageTime = Date.now()

        async function* handleData(data) {
            let processedAlready = 0

            for await (const chunk of data) {
                yield chunk

                processedAlready += chunk.length

                if (!this.canExecute(this.lastMessageTime))
                    continue

                this.lastMessageTime = Date.now()

                this.io.to(this.socketId)
                    .emit(this.ON_UPLOAD_EVENT, { filename, processedAlready })
                
                logger.info(`File [${filename}] got ${processedAlready} bytes to ${this.socketId}`)
            }
        }

        return handleData.bind(this)
    }

    async onFile(fieldname, file, filename) {
        const saveTo = `${this.downloadsFolder}/${filename}`
        await pipeline(
            file,
            this.handleFileBuffer.apply(this, [filename]),
            fs.createWriteStream(saveTo)
        )

        logger.info(`File [${filename}] finished`)
    }

    registerEvents(headers, onFinish) {
        const busboy = new Busboy({ headers })

        busboy.on('file', this.onFile.bind(this))
        busboy.on('finish', onFinish)

        return busboy
    }
}