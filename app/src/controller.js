export default class Controller {
    constructor({ api, view }) {
        this.api = api
        this.view = view

        this.uploadingFiles = new Map()
    }

    async initialize() {
        this.view.handleButton()
        this.view.handleInput(this.setFiles.bind(this))
        this.view.handleModal()
        this.view.handleDragAndDrop()
        this.view.handleDrop(this.setFiles.bind(this))

        this.api.getEvents({ onProgress: this.onProgress.bind(this) })

        await this.getFiles()
    }

    async onDrop(files) {

    }

    async onProgress({ filename, processedAlready }) {
        const file = this.uploadingFiles.get(filename)
        const processed = Math.ceil(processedAlready / file.size * 100)

        if (processed < 98) return;

        return this.getFiles()
    }

    async updateProgress(file, percent) {
        const uploadingFiles = this.uploadingFiles
        file.percent = percent

        const total = [...uploadingFiles.values()]
            .map(({ percent }) => percent ?? 0)
            .reduce((sum, current) => sum + current, 0)

        this.view.updateProgress(total)
    }

    async setFiles(files) {
        this.uploadingFiles.clear()
        this.view.openModal()
        this.view.changeProgressStatus(0)

        const requests = []
        for (const file of files) {
            this.uploadingFiles.set(file.name, file)
            requests.push(this.api.setFiles(file))
        }

        await Promise.all(requests)
        this.view.changeProgressStatus(100)

        setTimeout(() => this.view.closeModal(), 2000)

        await this.getFiles()
    }

    async getFiles() {
        const files = await this.api.getFiles()

        this.view.render(files)
    }
}