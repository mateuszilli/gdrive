import { jest } from '@jest/globals'
import { Readable, Transform, Writable } from 'stream'

export default class TestUtil {

    static mockDateNow(mockImplementations) {
        const dateNow = jest.spyOn(global.Date, global.Date.now.name)

        mockImplementations.forEach(time => {
            return dateNow.mockReturnValueOnce(time)
        })
    }

    static getTimeFromDate(dateString) {
        return new Date(dateString).getTime()
    }

    static generateReadbleStream(data) {
        return new Readable({
            objectMode: true,
            read() {
                for (const item of data) {
                    this.push(item)
                }

                this.push(null)
            }
        })
    }

    static generateTransformStream(onData) {
        return new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                onData(chunk)

                callback(null, chunk)
            }
        })
    }

    static generateWritableStream(onData) {
        return new Writable({
            objectMode: true,
            write(chunk, encoding, callback) {
                onData(chunk)

                callback(null, chunk)
            }
        })
    }
}