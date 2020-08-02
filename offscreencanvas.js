self.importScripts('boid.js')

let canvas
let isInit = false // init canvas only once
let cursor, lastX, lastY, hover // mouse controls
let boids = [] // entities

onmessage = function(event) {
	if(!isInit && 'canvas' in event.data) {
		isInit = true
		canvas = event.data.canvas
		const ctx = canvas.getContext('2d')
		init(ctx)
		postMessage({count: boids.length})
	}

	if(event.data.mouse && ('x' in event.data || 'y' in event.data)) {
		lastX = event.data.x
		lastY = event.data.y
	}

	if('hover' in event.data) {
		hover = event.data.hover
	}

	if(canvas && 'height' in event.data || 'width' in event.data) {
		canvas.height = event.data.height
		canvas.width = event.data.width
	}

	if(event.data.new && 'x' in event.data && 'y' in event.data) {
		boids.push(new Boid({
			x: event.data.x,
			y: event.data.y,
			angle: cursor.angle || Math.random() * Math.PI * 2,
			color: 'red'
		}))
		postMessage({count: boids.length})
	}

	if('direction' in event.data) {
		boids.forEach(boid => boid.behaviors['imitation of direction'] = event.data.direction)
	}

	if('avoidance' in event.data) {
		boids.forEach(boid => boid.behaviors['repulsion from individuals'] = event.data.avoidance)
	}

	if('flocking' in event.data) {
		boids.forEach(boid => boid.behaviors['attraction to group'] = event.data.flocking)
	}
}

function init(ctx) {	
	cursor = new Boid({
		x: 450,
		y: 100,
		angle: 0,
		color: 'orange',
		weight: 4,
		speed: 1
	})

	for (let index = 0; index < 200; index++) {
		const boid = new Boid({
			x: Math.random() * ctx.canvas.width,
			y: Math.random() * ctx.canvas.height,
			angle: Math.random() * Math.PI * 2,
		})
		boids.push(boid)
	}

	loop(ctx, boids)
}

function update(box, boids, deltaTime) {
	boids.forEach(boid => {
		boid.update({points: [...boids, cursor], box, deltaTime})
	})
	if(hover) {
		cursor.x = lastX
		cursor.y = lastY
		cursor.update({points: boids, box, deltaTime})
	}
}

function draw(ctx, boids) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
	boids.forEach(boid => {
		boid.draw(ctx)
	})
	if(hover) {
		cursor.x = lastX
		cursor.y = lastY
		cursor.draw(ctx, { withField: true })
	}
}

function loop(ctx, boids) {
	loopUpdate(ctx, boids)
	loopDraw(ctx, boids)
}

let newFrame = false
function loopUpdate(ctx, boids, lastTime = performance.now()) {
	const currentTime = performance.now()
	setTimeout(() => loopUpdate(ctx, boids, newFrame ? currentTime : lastTime), 8)
	if(newFrame) {
		update(ctx.canvas, boids, currentTime - lastTime)
	}
	newFrame = false
}

function loopDraw(ctx, boids) {
	requestAnimationFrame((time) => {
		newFrame = true
		draw(ctx, boids)
		loopDraw(ctx, boids)
		postMessage({frame: time})
	})
}

function drawPoint(ctx, x, y, color = 'black') {
	const size = 3
	ctx.fillStyle = color
	ctx.beginPath()
	ctx.moveTo(x, y)
	ctx.arc(
		x,
		y,
		size,
		0,
		2 * Math.PI,
	)
	ctx.fill()
}