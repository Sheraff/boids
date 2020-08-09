import * as wasm from "../pkg/boids.js"

let ctx

const channel = new BroadcastChannel('wasm interop')
channel.onmessage = ({data}) => {
	if(data.args.length === 2) {
		const [key, value] = data.args
		if(key === "frame")
			self.postMessage({frame: value})
		if(key === "tick")
			self.postMessage({update: value})
	} else {
		console.log(...data.args)
	}
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
	init(wasm, ctx)
	loopFrame(wasm.request_frame)
	loopTick(wasm.request_tick)
})

function loopFrame(callback, start = performance.now()) {
	requestAnimationFrame((time) => {
		callback(time - start)
		loopFrame(callback, time)
	})
}

function loopTick(callback, start = performance.now()) {
	setTimeout(() => {
		const time = performance.now()
		callback(time - start)
		loopTick(callback, time)
	}, 1)
}

function init(wasm, ctx) {
	self.onmessage = function(event) {
		if(event.data.new && 'x' in event.data && 'y' in event.data) {
			const count = wasm.add_one_boid(event.data.x, event.data.y)
			postMessage({count})
		}
		if('height' in event.data || 'width' in event.data) {
			wasm.set_canvas_dimensions(event.data.width, event.data.height)
			ctx.canvas.height = event.data.height
			ctx.canvas.width = event.data.width
		}
	}
}