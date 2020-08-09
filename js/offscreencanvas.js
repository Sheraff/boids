self.importScripts('./boid.js')

let DEBUG = false
let TIE_UPDATES_TO_FRAMES = true
let FIELD_OF_VIEW = false

/** @type HTMLCanvasElement */
let canvas
let isInit = false // init canvas only once

// mouse controls
/** @type Boid */
let cursor
/** @type number */
let lastX
/** @type number */
let lastY
/** @type boolean */
let hover

/** @type Array<Boid> - entities*/
let boids = []

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

	if('debug' in event.data) {
		DEBUG = event.data.debug
		if(!DEBUG)
			boids.forEach(boid => boid.resetColor())
	}

	if('tick' in event.data) {
		TIE_UPDATES_TO_FRAMES = event.data.tick
	}

	if('view' in event.data) {
		FIELD_OF_VIEW = event.data.view
	}
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 */
function init(ctx) {	
	cursor = new Boid({
		x: 450,
		y: 100,
		angle: 0,
		color: 'red',
		weight: 4,
		speed: 0,
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


/**
 * Split canvas into square cells of length equal to the maximum vision radius of a Boid.
 * 
 * Each boid is associated to a cell based on its (x,y) coordinates.
 * Each boid is also associated to all of its neighboring cells (incl. diagonals).
 * 
 * **Result**: all the boids one boid *might* see are associated to this boid's current cell
 * 
 * @param {HTMLCanvasElement} box 
 * @param {Array<Boid>} boids 
 */
function gridSplit({width, height}, boids) {
	const maxVisionRange = Math.max(...boids.map(({vision}) => vision.radius)) || 1
	const nbColumns = Math.ceil(width / maxVisionRange)
	const nbRows = Math.ceil(height / maxVisionRange)
	
	/** @type {Boid[][][]} */
	const cells = new Array(nbColumns)
		.fill(null)
		.map(() => new Array(nbRows)
			.fill(null)
			.map(() => [])
		)

	/** @type {Map<Boid,Array<Boid>>} */
	const map = new Map()

	boids.forEach(boid => {
		const {x, y} = boid
		
		const maxX = Math.min(x, width)
		const column = Math.floor(maxX / maxVisionRange)

		const maxY = Math.min(y, height)
		const row = Math.floor(maxY / maxVisionRange)
		
		map.set(boid, cells[column][row])

		void [-1, 0, 1].forEach(deltaCol => {
			void [-1, 0, 1].forEach(deltaRow => {
				const targetCol = column + deltaCol
				if(targetCol < 0 || targetCol >= nbColumns)
					return
				const targetRow = row + deltaRow
				if(targetRow < 0 || targetRow >= nbRows)
					return
				cells[targetCol][targetRow].push(boid)
			})
		})
	})

	return map
}

/**
 * @param {HTMLCanvasElement} box 
 * @param {Array<Boid>} boids 
 * @param {DOMHighResTimeStamp} deltaTime 
 */
function update(box, boids, deltaTime) {
	const allEntities = [...boids]
	if(hover && cursor.x && cursor.y)
		allEntities.push(cursor)

	const map = gridSplit(box, allEntities)

	if(DEBUG) {
		boids.forEach(boid => boid.color = 'black')
		map.get(boids[0]).forEach(boid => boid.color = 'red')
		boids[0].color = 'purple'
	}

	boids.forEach(boid => {
		boid.update({points: map.get(boid) || allEntities, box, deltaTime})
	})
	if(hover) {
		cursor.x = lastX
		cursor.y = lastY
		cursor.update({points: map.get(cursor) || allEntities, box, deltaTime})
	}
	self.postMessage({update: deltaTime})
}

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array<Boid>} boids 
 */
function draw(ctx, boids) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
	if(DEBUG) {
		drawGrid(ctx, boids)
	}
	boids.forEach(boid => {
		boid.draw(ctx, { withField: FIELD_OF_VIEW })
	})
	if(hover) {
		cursor.x = lastX
		cursor.y = lastY
		cursor.draw(ctx, { withField: true })
	}
}

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array<Boid>} boids 
 */
function loop(ctx, boids) {
	loopUpdate(ctx, boids)
	loopDraw(ctx, boids)
}

let newFrame = false
/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array<Boid>} boids 
 * @param {DOMHighResTimeStamp?} lastTime 
 */
function loopUpdate(ctx, boids, lastTime = performance.now()) {
	const currentTime = performance.now()
	setTimeout(() => {
		if(!TIE_UPDATES_TO_FRAMES)
			newFrame = true
		if(newFrame)
			update(ctx.canvas, boids, currentTime - lastTime)
		loopUpdate(ctx, boids, newFrame ? currentTime : lastTime)
	}, 1)
	newFrame = false
}

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array<Boid>} boids 
 */
function loopDraw(ctx, boids) {
	requestAnimationFrame((time) => {
		newFrame = true
		draw(ctx, boids)
		loopDraw(ctx, boids)
		postMessage({frame: time})
	})
}

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {CanvasColor} color 
 */
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

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array<Boid>} boids 
 * @param {CanvasColor} color 
 */
function drawGrid(ctx, boids, color = 'black') {
	const {width, height} = ctx.canvas
	const maxVisionRange = Math.max(...boids.map(({vision}) => vision.radius)) || 1
	const nbColumns = Math.ceil(width / maxVisionRange)
	const nbRows = Math.ceil(height / maxVisionRange)
	
	ctx.strokeStyle = color
	
	for(let i = 1; i < nbColumns; i++) {
		ctx.beginPath()
		ctx.moveTo(maxVisionRange * i, 0)
		ctx.lineTo(maxVisionRange * i, height)
		ctx.stroke()
	}

	for(let i = 1; i < nbRows; i++) {
		ctx.beginPath()
		ctx.moveTo(0, maxVisionRange * i)
		ctx.lineTo(width, maxVisionRange * i)
		ctx.stroke()
	}

}