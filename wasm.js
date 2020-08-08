const canvas = document.createElement('canvas')
canvas.height = innerHeight
canvas.width = innerWidth
document.body.appendChild(canvas)
const worker = new Worker("rustWorker.js", { type: "module" })
const offscreen = canvas.transferControlToOffscreen()
worker.postMessage({canvas: offscreen}, [offscreen])
