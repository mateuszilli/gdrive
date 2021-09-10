import {
    describe,
    test,
    expect,
    jest,
    beforeEach
} from '@jest/globals'
import fs from 'fs'
import { resolve } from 'path'
import { pipeline } from 'stream/promises'
import { logger } from '../../src/logger'
import UploadHandler from '../../src/uploadHandler'
import TestUtil from './_util/testUtil'

describe('#UploadHandler', () => {
    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation()
    })

    const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {}
    }

    describe('#registerEvents', () => {
        test('should call onFile and onFinish functions on Busboy instance', () => {
            const uploadHandler = new UploadHandler({
                io: ioObj,
                socketId: '01',
                downloadsFolder: '/tmp'
            })

            jest.spyOn(uploadHandler, uploadHandler.onFile.name)
                .mockResolvedValue()

            const headers = {
                'content-type': 'multipart/form-data; boundary='
            }

            const onFinish = jest.fn()
            const busboyInstance = uploadHandler.registerEvents(headers, onFinish)
            const chunks = ['chunk', 'of', 'data']
            const readable = TestUtil.generateReadbleStream(chunks)

            busboyInstance.emit('file', 'fieldname', readable, 'filename.txt')
            busboyInstance.listeners('finish')[0].call()

            expect(uploadHandler.onFile).toHaveBeenCalled()
            expect(onFinish).toHaveBeenCalled()
        })
    })

    describe('#onFile', () => {
        test('given a stream file it should save it on disk', async () => {
            const uploadHandler = new UploadHandler({
                io: ioObj,
                socketId: '01',
                downloadsFolder: '/tmp'
            })

            const onWrite = jest.fn()
            jest.spyOn(fs, fs.createWriteStream.name)
                .mockImplementation(() => TestUtil.generateWritableStream(onWrite))

            const onTransform = jest.fn()
            jest.spyOn(uploadHandler, uploadHandler.handleFileBuffer.name)
                .mockImplementation(() => TestUtil.generateTransformStream(onTransform))

            const chunks = ['ohhhhhhh', 'jiraya']
            const params = {
                fieldname: 'text',
                file: TestUtil.generateReadbleStream(chunks),
                filename: 'mockfile.txt'
            }

            await uploadHandler.onFile(...Object.values(params))
            
            const expectedFilePath = resolve(uploadHandler.downloadsFolder, params.filename)

            expect(onWrite.mock.calls.join()).toEqual(chunks.join())
            expect(onTransform.mock.calls.join()).toEqual(chunks.join())
            expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilePath)
        })
    })

    describe('#handleFileBuffer', () => {
        test('should call emit function and it is a transform stream', async () => {
            jest.spyOn(ioObj, ioObj.to.name)
            jest.spyOn(ioObj, ioObj.emit.name)

            const uploadHandler = new UploadHandler({
                io: ioObj,
                socketId: '01',
                downloadsFolder: '/tmp'
            })

            jest.spyOn(uploadHandler, uploadHandler.canExecute.name)
                .mockReturnValueOnce(true)

            const chunks = ['hello']
            const readable = TestUtil.generateReadbleStream(chunks)
            const onWrite = jest.fn()
            const writeble = TestUtil.generateWritableStream(onWrite)

            await pipeline(
                readable,
                uploadHandler.handleFileBuffer('file.txt'),
                writeble
            )

            expect(ioObj.to).toHaveBeenCalledTimes(chunks.length)
            expect(ioObj.emit).toHaveBeenCalledTimes(chunks.length)
            expect(onWrite).toBeCalledTimes(chunks.length)
            expect(onWrite.mock.calls.join()).toEqual(chunks.join())
        })

        test('given message time delay as 2 secs it should emit only two messages during 3 seconds period', async () => {
            jest.spyOn(ioObj, ioObj.emit.name)

            const date = '2021-09-01 12:00' // lastMessageTime was initialized with Date.now() 
            const onFirstLastMessageChange = TestUtil.getTimeFromDate(`${date}:00`) // Time of lastMessage
            const onFirstMessageArrived = TestUtil.getTimeFromDate(`${date}:03`) // First message arrived -> Hello
            const onSecondLastMessageChange = onFirstMessageArrived // lastMessageTime was updated with Date.now()
            const onSecondMessageArrived = TestUtil.getTimeFromDate(`${date}:04`) // Second message arrived -> world
            const onThirdMessageArrived = TestUtil.getTimeFromDate(`${date}:06`) // Third message arrived -> !

            TestUtil.mockDateNow([
                onFirstLastMessageChange,
                onFirstMessageArrived,
                onSecondLastMessageChange,
                onSecondMessageArrived,
                onThirdMessageArrived
            ])

            const filename = 'test.txt'
            const messages = ['Hello', 'world', '!']
            const readable = TestUtil.generateReadbleStream(messages)
            
            const uploadHandler = new UploadHandler({
                io: ioObj,
                socketId: '01',
                downloadsFolder: '/tmp',
                messageMilisecondsDelay: 2000
            })

            await pipeline(
                readable,
                uploadHandler.handleFileBuffer(filename)
            )

            const expectedMessagesSent = 2
            expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessagesSent)

            const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls
            expect(firstCallResult).toEqual([uploadHandler.ON_UPLOAD_EVENT, { filename, processedAlready: 'Hello'.length }])
            expect(secondCallResult).toEqual([uploadHandler.ON_UPLOAD_EVENT, { filename, processedAlready: messages.join('').length }])
            
        })
    })

    describe('#canExecute', () => {
        test('should return true when time is later than specified delay', () => {
            const uploadHandler = new UploadHandler({
                io: {},
                socketId: '01',
                downloadsFolder: '/tmp',
                messageMilisecondsDelay: 1000
            })

            const timeNow = TestUtil.getTimeFromDate('2021-09-01 12:00:03')
            const lastExecution = TestUtil.getTimeFromDate('2021-09-01 12:00:00')

            TestUtil.mockDateNow([timeNow])

            const result = uploadHandler.canExecute(lastExecution)

            expect(result).toBeTruthy()
        })

        test('should return false when time isnt later than specified delay', () => {
            const uploadHandler = new UploadHandler({
                io: {},
                socketId: '01',
                downloadsFolder: '/tmp',
                messageMilisecondsDelay: 1000
            })

            const timeNow = TestUtil.getTimeFromDate('2021-09-01 12:00:01')
            const lastExecution = TestUtil.getTimeFromDate('2021-09-01 12:00:00')

            TestUtil.mockDateNow([timeNow])

            const result = uploadHandler.canExecute(lastExecution)

            expect(result).toBeFalsy()
        })
    })
})