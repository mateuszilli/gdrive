export default class Api {
    constructor({ apiUrl }) {
        this.apiUrl = apiUrl
        this.io = io.connect(apiUrl, { withCredentials: false })
        this.socketId
    }

    async getEvents({ onProgress }) {
        this.io.on('connect', this.onConnect.bind(this))
        this.io.on('file-upload', onProgress)
    }

    onConnect(message) {
        this.socketId = this.io.id
    }

    async getFiles() {
        const files = await fetch(this.apiUrl)

        return await files.json();
    }

    async setFiles(files) {
        const formData = new FormData()
        formData.append('files', files)

        const response = await fetch(`${this.apiUrl}?socketId=${this.socketId}`, {
            method: 'POST',
            body: formData
        })

        return await response.json();
    }
}