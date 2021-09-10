import {
    describe,
    test,
    expect,
    jest,
    beforeEach,
    beforeAll,
    afterAll
} from '@jest/globals'
import fs from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import FormData from 'form-data'

import Routes from './../../src/routes.js'
import TestUtil from '../unit/_util/testUtil.js'
import { logger } from '../../src/logger.js'


describe('#Routes integration test', () => {
    let downloadsFolder

    beforeAll(async () => {
        downloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'downloads-'))
    })

    afterAll(async () => {
        await fs.promises.rm(downloadsFolder, { recursive: true })
    })

    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation()
    })

    const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {}
    }

    describe('#getFileStatus', () => {
        test('should upload file to the folder', async () => {
            const filename = 'test.txt'
            const fileStream = fs.createReadStream(`./test/integration/_mock/${filename}`)
            const response = TestUtil.generateWritableStream(() => {})

            const form = new FormData()
            form.append('photo', fileStream)

            const defaultParams = {
                request: Object.assign(form, {
                    headers: form.getHeaders(),
                    method: 'POST',
                    url: '?socketId=01'
                }),
                response: Object.assign(response, {
                    setHeader: jest.fn(),
                    writeHead: jest.fn(),
                    end: jest.fn()
                }),
                values: () => Object.values(defaultParams)
            }

            const dirBefore = await fs.promises.readdir(downloadsFolder)
            expect(dirBefore).toEqual([])

            const routes = new Routes(downloadsFolder)
            routes.setSocketInstance(ioObj)
            await routes.handler(...defaultParams.values())

            const dirAfter = await fs.promises.readdir(downloadsFolder)
            expect(dirAfter).toEqual([filename])

            expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200)

            const expectedResult = JSON.stringify({ result: 'Files uploaded with success' })
            expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult)
        })
    })
})