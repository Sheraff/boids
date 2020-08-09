const canvas = document.createElement('canvas')
canvas.height = innerHeight
canvas.width = innerWidth
document.body.appendChild(canvas)
const worker = new Worker("/js/rustWorker.js", { type: "module" })
const offscreen = canvas.transferControlToOffscreen()
worker.postMessage({canvas: offscreen}, [offscreen])


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