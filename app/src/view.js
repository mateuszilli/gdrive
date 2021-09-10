export default class View {
    constructor() {
        this.tbody = document.getElementById('tbody')

        this.inputNewFile = document.getElementById('input-new-file')
        this.buttonNewFile = document.getElementById('button-new-file')
        this.elementProgressModal = document.getElementById('progress-modal')
        this.elementProgressBar = document.getElementById('progress-bar')
        this.elementProgressStatus = document.getElementById('progress-status')
        this.elementDropArea = document.getElementById('drop-area')
        this.modalInstance = {}

        this.formatter = new Intl.DateTimeFormat('pt-br', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    handleButton() {
        this.buttonNewFile.onclick = () => this.inputNewFile.click()
    }

    handleInput(fn) {
        this.inputNewFile.onchange = (e) => fn(e.target.files)
    }

    handleModal() {
        this.modalInstance = M.Modal.init(this.elementProgressModal, {
            opacity: 0,
            dismissable: false,
            onOpenEnd() {
                this.$overlay[0].remove()
            }
        })
    }

    handleDragAndDrop() {
        const disable = (e) => {
            e.preventDefault()
            e.stopPropagation()
        }

        const highlight = (e) => {
            this.elementDropArea.classList.add('highlight')
            this.elementDropArea.classList.add('drop-area')
        }

        document.body.addEventListener('dragenter', disable, false)
        document.body.addEventListener('dragover', disable, false)
        document.body.addEventListener('dragleave', disable, false)
        document.body.addEventListener('drop', disable, false)
        // this.elementDropArea.addEventListener(event, preventDefault, false)

        this.elementDropArea.addEventListener('dragenter', highlight, false)
        this.elementDropArea.addEventListener('dragover', highlight, false)
    }

    handleDrop(fn) {
        const drop = (event) => {
            this.elementDropArea.classList.remove('drop-area')

            const files = event.dataTransfer.files
            return fn(files)
        }

        this.elementDropArea.addEventListener('drop', drop, false)
    }

    openModal() {
        this.modalInstance.open()
    }

    closeModal() {
        this.modalInstance.close()
    }

    changeProgressStatus(size) {
        this.elementProgressStatus.innerHTML = `Uploading in <b>${Math.floor(size)}%<b>`
        this.elementProgressBar.value = size
    }

    getIcon(file) {
        const colors = {
            image: 'yellow600',
            movie: 'red600',
            content_copy: ''
        }

        const icon = file.match(/\.mp4/i) ? 'movie' 
            : file.match(/\.jp|png/i) ? 'image' 
            : 'content_copy'
    
        return `<i class="material-icons ${colors[icon]} left">${icon}</i>`
    }

    render(files) {
        const template = ({file, owner, size, lastModified}) => `
            <tr>
                <td>${this.getIcon(file)} ${file}</td>
                <td>${owner}</td>
                <td>${this.formatter.format(new Date(lastModified))}</td>
                <td>${size}</td>
            </tr>
        `

        this.tbody.innerHTML = files.map(template).join('')
    }
}