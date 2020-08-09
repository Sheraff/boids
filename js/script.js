const canvas = document.createElement('canvas')
canvas.height = innerHeight
canvas.width = innerWidth
document.body.appendChild(canvas)
const offscreen = canvas.transferControlToOffscreen()
const worker = new Worker("/js/offscreencanvas.js")
worker.postMessage({canvas: offscreen}, [offscreen])

window.addEventListener('resize', () => worker.postMessage({height: innerHeight, width: innerWidth}))
canvas.addEventListener('mousemove', ({x, y}) => worker.postMessage({mouse: true, x, y}))
canvas.addEventListener('mouseenter', () => worker.postMessage({hover: true}))
canvas.addEventListener('mouseleave', () => worker.postMessage({hover: false}))
canvas.addEventListener('click', ({x, y}) => worker.postMessage({new: true, x, y}))

void [
	'direction',
	'avoidance',
	'flocking',
].forEach(key => {
	document.getElementById(key).addEventListener('input', ({target}) => {
		const value = target.value / 100
		worker.postMessage({[key]: value})
		target.nextElementSibling.innerText = value
	})
})


let frames = []
worker.addEventListener('message', ({data}) => {
	if('count' in data) {
		document.getElementById('count').innerText = data.count + ' boids'
	}

	if('frame' in data) {
		frames.push(data.frame)
		if(frames.length > 100)
			frames.splice(0, frames.length - 100)
		const fps = Math.round(1000 * (frames.length - 1) / (data.frame - frames[0]))
		document.getElementById('fps').innerText = fps + ' fps'
	}
})