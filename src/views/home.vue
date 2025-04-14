<template>
    <div id="container" style="cursor: crosshair"></div>
</template>

<script>
import pLimit from 'p-limit'
import Konva from 'konva'
import fs from 'fs'
const Store = require('electron-store')
const store = new Store()
export default {
    data() {
        return {
            clientWidth: document.documentElement.clientWidth || document.body.clientWidth,
            clientHeight: document.documentElement.clientHeight || document.body.clientHeight,
            stage: null,
            layer: null,
            group: null,
            imageData: [],
            limit: null,
            tolerance: 6,
            unit: ''
        }
    },
    mounted() {
        this.limit = pLimit(4)
        window.ipcRenderer.on('recognize', (event, url) => {
            fs.readFile(url, (err, data) => {
                if (err) {
                    return
                }
                this.recognize('data:image/png;base64,' + data.toString('base64'))
            })
        })
        window.ipcRenderer.on('colorPicker', (event, url) => {
            fs.readFile(url, (err, data) => {
                if (err) {
                    return
                }
                this.colorPicker('data:image/png;base64,' + data.toString('base64'))
            })
        })
    },
    methods: {
        recognize(data) {
            this.unit = store.get('unit') || 'px'
            let image = new Image()
            image.src = data
            let canvas = document.createElement('canvas')
            canvas.style.display = 'none'
            if (this.stage) {
                this.stage.destroy()
            }
            this.stage = new Konva.Stage({
                container: 'container',
                width: this.clientWidth,
                height: this.clientHeight
            })
            this.layer = new Konva.Layer()
            image.onload = () => {
                canvas.width = image.width / (window.devicePixelRatio || 1)
                canvas.height = image.height / (window.devicePixelRatio || 1)
                let ctx = canvas.getContext('2d')
                ctx.drawImage(
                    image,
                    0,
                    0,
                    image.width / (window.devicePixelRatio || 1),
                    image.height / (window.devicePixelRatio || 1)
                )
                this.imageData = ctx.getImageData(
                    0,
                    0,
                    image.width / (window.devicePixelRatio || 1),
                    image.height / (window.devicePixelRatio || 1)
                )
                canvas.remove()
                let backgroundImage = new Konva.Image({
                    x: 0,
                    y: 0,
                    image: image,
                    width: image.width / (window.devicePixelRatio || 1),
                    height: image.height / (window.devicePixelRatio || 1)
                })
                this.layer.add(backgroundImage)
                this.stage.add(this.layer)
                backgroundImage.on('mousemove', async event => {
                    let x = event.evt.layerX
                    let y = event.evt.layerY
                    let width = image.width / (window.devicePixelRatio || 1)
                    let height = image.height / (window.devicePixelRatio || 1)
                    let directionData = []
                    let source = this.getRgba(x, y)
                    directionData.push(this.limit(() => this.fourSides('top', width, height, x, y, source)))
                    directionData.push(this.limit(() => this.fourSides('bottom', width, height, x, y, source)))
                    directionData.push(this.limit(() => this.fourSides('left', width, height, x, y, source)))
                    directionData.push(this.limit(() => this.fourSides('right', width, height, x, y, source)))
                    let result = await Promise.all(directionData)
                    if (this.group) {
                        this.group.destroy()
                    }
                    this.group = new Konva.Group({
                        x: 0,
                        y: 0
                    })
                    let text = ''
                    if (this.unit === 'px') {
                        text =
                            parseInt(result[3][2] - result[2][2] + 1) + '×' + parseInt(result[1][3] - result[0][3] - 1)
                    } else if (this.unit === 'rem') {
                        text =
                            Math.round((parseInt(result[3][2] - result[2][2] + 1) * 100) / 16) / 100 +
                            '×' +
                            Math.round((parseInt(result[1][3] - result[0][3] - 1) * 100) / 16) / 100
                    }

                    let reactX = 0
                    let reactY = 0
                    if (x + 120 > width) {
                        // left
                        reactX = x - 15 - 15 * text.length
                    } else {
                        // right
                        reactX = x + 15
                    }
                    if (y + 120 > height) {
                        // top
                        reactY = y - 15 - 45
                    } else {
                        // bottom
                        reactY = y + 15
                    }
                    let rect = new Konva.Rect({
                        x: reactX,
                        y: reactY,
                        width: 11.3 * text.length,
                        height: 30,
                        fill: '#2d2d2d',
                        opactity: 0.2,
                        stroke: '#2d2d2d',
                        strokeWidth: 1,
                        cornerRadius: 8
                    })
                    let textObject = new Konva.Text({
                        x: reactX + 2 * text.length,
                        y: reactY + 10,
                        text: text,
                        fontSize: 13,
                        fill: 'white'
                    })
                    let topLine = new Konva.Line({
                        points: result[0],
                        stroke: 'blue',
                        strokeWidth: 1.25
                    })
                    let topBoundary = new Konva.Line({
                        points: [result[0][2] - 4, result[0][3], result[0][2] + 4, result[0][3]],
                        stroke: 'blue',
                        strokeWidth: 1.25
                    })
                    let bottomLine = new Konva.Line({
                        points: result[1],
                        stroke: 'blue',
                        strokeWidth: 1.25
                    })
                    let bottomBoundary = new Konva.Line({
                        points: [result[1][2] - 4, result[1][3], result[1][2] + 4, result[1][3]],
                        stroke: 'blue',
                        strokeWidth: 1.25
                    })
                    let leftLine = new Konva.Line({
                        points: result[2],
                        stroke: 'blue',
                        strokeWidth: 1.25
                    })
                    let leftBoundary = new Konva.Line({
                        points: [result[2][2], result[2][3] - 4, result[2][2], result[2][3] + 4],
                        stroke: 'blue',
                        strokeWidth: 1.25
                    })
                    let rightLine = new Konva.Line({
                        points: result[3],
                        stroke: 'blue',
                        strokeWidth: 1.25
                    })
                    let rightBoundary = new Konva.Line({
                        points: [result[3][2], result[3][3] - 4, result[3][2], result[3][3] + 4],
                        stroke: 'blue',
                        strokeWidth: 1.25
                    })
                    this.group.add(rect)
                    this.group.add(textObject)
                    this.group.add(topLine)
                    this.group.add(topBoundary)
                    this.group.add(bottomLine)
                    this.group.add(bottomBoundary)
                    this.group.add(leftLine)
                    this.group.add(leftBoundary)
                    this.group.add(rightLine)
                    this.group.add(rightBoundary)
                    this.layer.add(this.group)
                    this.layer.draw()
                })
            }
        },
        rgbDistance(source, target) {
            return Math.sqrt((source[0] - target[0]) ** 2 + (source[1] - target[1]) ** 2 + (source[2] - target[2]) ** 2)
        },
        fourSides(direction, width, height, x, y, source) {
            if (direction === 'top') {
                for (let i = y; i >= 0; i--) {
                    let target = this.getRgba(x, i)
                    let distance = parseInt(this.rgbDistance(source, target))
                    if (distance > this.tolerance) {
                        return [x, y, x, i]
                    }
                    if (i == 0) {
                        return [x, y, x, i]
                    }
                }
            } else if (direction === 'bottom') {
                for (let i = y; i <= height; i++) {
                    let target = this.getRgba(x, i)
                    let distance = parseInt(this.rgbDistance(source, target))
                    if (distance > this.tolerance) {
                        return [x, y, x, i]
                    }
                    if (i == height) {
                        return [x, y, x, i]
                    }
                }
            } else if (direction === 'left') {
                for (let i = x; i >= 0; i--) {
                    let distance = parseInt(this.rgbDistance(source, this.getRgba(i, y)))
                    if (distance > this.tolerance) {
                        return [x, y, i, y]
                    }
                    if (i == 0) {
                        return [x, y, i, y]
                    }
                }
            } else if (direction === 'right') {
                for (let i = x; i <= width; i++) {
                    let distance = parseInt(this.rgbDistance(source, this.getRgba(i, y)))
                    if (distance > this.tolerance) {
                        return [x, y, i, y]
                    }
                    if (i == width) {
                        return [x, y, i, y]
                    }
                }
            }
        },
        getRgba(x, y) {
            let r = this.imageData.data[(y * this.imageData.width + x) * 4 + 0] // R
            let g = this.imageData.data[(y * this.imageData.width + x) * 4 + 1] // G
            let b = this.imageData.data[(y * this.imageData.width + x) * 4 + 2] // B
            // let a = this.imageData.data[(y * this.imageData.width + x) * 4 + 3] // A
            // a / 255
            return [r, g, b]
        },
        colorPicker(data) {
            let image = new Image()
            image.src = data
            let canvas = document.createElement('canvas')
            canvas.style.display = 'none'
            if (this.stage) {
                this.stage.destroy()
            }
            this.stage = new Konva.Stage({
                container: 'container',
                width: this.clientWidth,
                height: this.clientHeight
            })
            this.layer = new Konva.Layer()
            image.onload = () => {
                canvas.width = image.width / (window.devicePixelRatio || 1)
                canvas.height = image.height / (window.devicePixelRatio || 1)
                let ctx = canvas.getContext('2d')
                ctx.drawImage(
                    image,
                    0,
                    0,
                    image.width / (window.devicePixelRatio || 1),
                    image.height / (window.devicePixelRatio || 1)
                )
                this.imageData = ctx.getImageData(
                    0,
                    0,
                    image.width / (window.devicePixelRatio || 1),
                    image.height / (window.devicePixelRatio || 1)
                )
                canvas.remove()
                let backgroundImage = new Konva.Image({
                    x: 0,
                    y: 0,
                    image: image,
                    width: image.width / (window.devicePixelRatio || 1),
                    height: image.height / (window.devicePixelRatio || 1)
                })
                this.layer.add(backgroundImage)
                this.stage.add(this.layer)
                backgroundImage.on('mousemove', async event => {
                    let x = event.evt.layerX
                    let y = event.evt.layerY
                    let width = image.width / (window.devicePixelRatio || 1)
                    let height = image.height / (window.devicePixelRatio || 1)

                    let source = this.getRgba(x, y)

                    if (this.group) {
                        this.group.destroy()
                    }
                    this.group = new Konva.Group({
                        x: 0,
                        y: 0
                    })
                    let text =
                        '#' +
                        source[0].toString(16).padStart(2, '0') +
                        source[1].toString(16).padStart(2, '0') +
                        source[2].toString(16).padStart(2, '0')
                    let reactX = 0
                    let reactY = 0
                    if (x + 120 > width) {
                        // left
                        reactX = x - 15 - 15 * text.length
                    } else {
                        // right
                        reactX = x + 15
                    }
                    if (y + 120 > height) {
                        // top
                        reactY = y - 15 - 45
                    } else {
                        // bottom
                        reactY = y + 15
                    }
                    let rect = new Konva.Rect({
                        x: reactX,
                        y: reactY,
                        width: 70,
                        height: 30,
                        fill: '#2d2d2d',
                        opactity: 0.2,
                        stroke: '#2d2d2d',
                        strokeWidth: 1,
                        cornerRadius: 8
                    })
                    let textObject = new Konva.Text({
                        x: reactX + 10,
                        y: reactY + 10,
                        text: text,
                        fontSize: 13,
                        fill: 'white'
                    })

                    this.group.add(rect)
                    this.group.add(textObject)
                    this.layer.add(this.group)
                    this.layer.draw()
                })
            }
        }
    }
}
</script>

<style scoped></style>
