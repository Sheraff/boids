import * as wasm from "../pkg/boids.js"

let ctx

const channel = new BroadcastChannel('wasm interop')
channel.onmessage = ({data}) => {
	console.log(...data.args)
}

function onCanvasMessage(resolve) {
	function onMessage(event) {
		if('canvas' in event.data) {
			const canvas = event.data.canvas
			ctx = canvas.getContext('2d')
			resolve()
			self.removeEventListener('message', onMessage)
		}
	}
	self.addEventListener('message', onMessage)
}

const ready = Promise.all([
	wasm.default(),
	new Promise(onCanvasMessage)
])

ready.then(() => {
	console.log(wasm, ctx)
	wasm.console_log('READY')
	wasm.send_context(ctx, ctx.canvas.height, ctx.canvas.width)
	const count = wasm.get_boids_count()
	postMessage({count})
	loop(wasm.request_frame)
})

function loop (callback, start = performance.now()) {
	requestAnimationFrame((time) => {
		callback(time - start)
		loop(callback, time)
		self.postMessage({frame: time})
	})
}