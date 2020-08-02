import COLORS from './colors.js'
import Boid from './boid.js'

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

function resize () {
	canvas.height = innerHeight
	canvas.width = innerWidth
}
resize()
addEventListener('resize', resize)

const ctx = canvas.getContext('2d')

const cursor = new Boid({
	x: 450,
	y: 100,
	angle: 0,
	color: 'orange',
	weight: 3,
})
const boids = []

for (let index = 0; index < 300; index++) {
	const boid = new Boid({
		x: Math.random() * ctx.canvas.width,
		y: Math.random() * ctx.canvas.height,
		angle: Math.random() * Math.PI * 2,
	})
	boids.push(boid)
}

// {
// 	boids.push(new Boid({
// 		x: 200,
// 		y: 200,
// 		angle: .1,
// 		color: 'orange'
// 	}))
// 	boids.push(new Boid({
// 		x: 220,
// 		y: 200,
// 		angle: .1,
// 		color: 'orange'
// 	}))
// 	boids.push(new Boid({
// 		x: 200,
// 		y: 220,
// 		angle: .1,
// 		color: 'orange'
// 	}))
// 	boids.push(new Boid({
// 		x: 220,
// 		y: 220,
// 		angle: .1,
// 		color: 'orange'
// 	}))
// 	boids.push(new Boid({
// 		x: 210,
// 		y: 240,
// 		angle: .1,
// 		color: 'orange'
// 	}))

// 	boids.push(new Boid({
// 		x: 600,
// 		y: 600,
// 		angle: Math.PI,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 620,
// 		y: 600,
// 		angle: Math.PI,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 600,
// 		y: 620,
// 		angle: Math.PI,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 620,
// 		y: 620,
// 		angle: Math.PI,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 610,
// 		y: 640,
// 		angle: Math.PI,
// 		color: 'green'
// 	}))

// 	boids.push(new Boid({
// 		x: 200,
// 		y: 600,
// 		angle: Math.PI * 3/2,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 220,
// 		y: 600,
// 		angle: Math.PI * 3/2,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 200,
// 		y: 620,
// 		angle: Math.PI * 3/2,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 220,
// 		y: 620,
// 		angle: Math.PI * 3/2,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 210,
// 		y: 640,
// 		angle: Math.PI * 3/2,
// 		color: 'green'
// 	}))

// 	boids.push(new Boid({
// 		x: 600,
// 		y: 200,
// 		angle: Math.PI * 1/2,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 620,
// 		y: 200,
// 		angle: Math.PI * 1/2,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 600,
// 		y: 220,
// 		angle: Math.PI * 1/2,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 620,
// 		y: 220,
// 		angle: Math.PI * 1/2,
// 		color: 'green'
// 	}))
// 	boids.push(new Boid({
// 		x: 610,
// 		y: 240,
// 		angle: Math.PI * 1/2,
// 		color: 'green'
// 	}))
// }

let lastX, lastY, hover
canvas.addEventListener('mousemove', ({x, y}) => {
	lastX = x
	lastY = y
})
canvas.addEventListener('mouseenter', () => hover = true)
canvas.addEventListener('mouseleave', () => hover = false)

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

// function update() {
// 	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
// 	const boid = boids[1]
// 	boid.draw(ctx, { withField: true })
// 	for (let i = 0; i < Math.PI * 2; i += .1) {
// 		const x = boid.x - Math.sin(i) * (boid.vision.radius - 1)
// 		const y = boid.y - Math.cos(i) * (boid.vision.radius - 1)
// 		const visible = boid.testPointVisibility({x, y})
// 		drawPoint(ctx, x, y, visible ? 'green' : 'red')
// 	}
// 	boid.angle += .01
// }

loop()
// // update(ctx)

function update(ctx) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
	boids.forEach(boid => {
		boid.update({points: [...boids, cursor], box: ctx.canvas})
		boid.draw(ctx)
	})
	if(hover) {
		cursor.x = lastX
		cursor.y = lastY
		cursor.update({points: boids, box: ctx.canvas})
		cursor.draw(ctx, { withField: true })
	}
}

function loop() {
	requestAnimationFrame(() => {
		update(ctx)
		loop()
	})
}