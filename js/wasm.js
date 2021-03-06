const canvas = document.createElement('canvas')
canvas.height = innerHeight
canvas.width = innerWidth
document.body.appendChild(canvas)
const worker = new Worker("js/rustWorker.js", { type: "module" })
const offscreen = canvas.transferControlToOffscreen()
worker.postMessage({canvas: offscreen}, [offscreen])

window.addEventListener('resize', () => worker.postMessage({height: innerHeight, width: innerWidth}))
canvas.addEventListener('click', ({x, y}) => worker.postMessage({new: true, x, y}))

void [
	// 'direction',
	// 'avoidance',
	// 'flocking',
	'debug',
	'tick',
	'view'
].forEach(key => {
	const input = document.getElementById(key)
	input.addEventListener(input.type === "range" ? "input" : "change", ({target}) => {
		let value = input.type === "range"
			? target.value / 100
			: target.checked
		worker.postMessage({[key]: value})
		target.nextElementSibling.innerText = value
	})
})

let frames = []
let updates = []
worker.addEventListener('message', ({data}) => {
	if('count' in data) {
		document.getElementById('count').innerText = data.count + ' boids'
	}

	if('frame' in data) {
		frames.push(data.frame)
		if(frames.length > 100)
			frames.splice(0, frames.length - 100)
		const fps = Math.round(1000 * (frames.length - 1) / frames.reduce((sum, curr) => sum + curr, 0))
		document.getElementById('fps').innerText = fps + ' fps'
	}

	if('update' in data) {
		updates.push(data.update)
		if(updates.length > 100)
			updates.splice(0, updates.length - 100)
		const ups = Math.round(1000 * (updates.length - 1) / updates.reduce((sum, curr) => sum + curr, 0))
		document.getElementById('ups').innerText = ups + ' ups'
	}
})