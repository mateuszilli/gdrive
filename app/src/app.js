import Controller from './controller.js';
import Api from './api.js';
import View from './view.js';

const API_URL = 'http://localhost:3000'

const controller = new Controller({
    api: new Api({ apiUrl: API_URL }),
    view: new View()
})

try {
    await controller.initialize()
} catch (error) {
    console.error('Error on initializing', error)
}