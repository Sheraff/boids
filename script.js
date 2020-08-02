const canvas = document.createElement('canvas')
canvas.height = innerHeight
canvas.width = innerWidth
document.body.appendChild(canvas)
const offscreen = canvas.transferControlToOffscreen()
const worker = new Worker("offscreencanvas.js")
worker.postMessage({canvas: offscreen}, [offscreen])

window.addEventListener('resize', () => worker.postMessage({height: innerHeight, width: innerWidth}))
canvas.addEventListener('mousemove', ({x, y}) => worker.postMessage({x, y}))
canvas.addEventListener('mouseenter', () => worker.postMessage({hover: true}))
canvas.addEventListener('mouseleave', () => worker.postMessage({hover: false}))

