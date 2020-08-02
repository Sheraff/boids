import circularMedian from './median.js'

const BOUND = 10

export default class Boid {
	constructor({
		angle = 0,
		x = 0,
		y = 0,
		color = 'green',
		size,
	}) {
		this.angle = angle // > 0; < 2𝜋
		this.x = x
		this.y = y
		this.color = color
		this.size = size || 15 + Math.random() * 10 // weight in averages
		this.width = .6 // in radians, so that shapes are constant across sizes
		this.vision = {
			radius: 100,
			radians: 3 / 2 * Math.PI // > 0; < 2𝜋
		}
		this.linearSpeed = 2.5 + Math.random() * 0
		this.angularSpeed = 0
		this.maxAngularSpeed = (Math.PI * 2) / 45 * (Math.random() + 1) // lower max angular speed leads to more predictable patterns
		this.behaviors = {
			'repulsion from individuals': .1,
			'imitation of direction': .06,
			'attraction to group': .03,
		}
		this.wearsHat = false // DEBUG: useful to indicate some property
	}

	set angle(value) {
		if(value < 0)
			this._angle = value % (Math.PI * 2) + Math.PI * 2
		else
			this._angle = value % (Math.PI * 2)

	}

	get angle() {
		return this._angle
	}

	draw(ctx, { withField } = {}) {
		const preserveFill = ctx.fillStyle

		if(withField)
			this.drawFieldOfView(ctx)

		if(this.wearsHat)
			this.drawHat(ctx)

		this.drawTriangle(ctx)
		ctx.fillStyle = preserveFill
	}

	drawHat(ctx) {
		ctx.fillStyle = this.color
		ctx.beginPath()
		ctx.moveTo(this.x, this.y)
		ctx.arc(
			this.x,
			this.y,
			this.size / 4,
			0,
			2 * Math.PI,
		)
		ctx.fill()
	}

	drawTriangle(ctx) {
		ctx.fillStyle = this.color
		ctx.beginPath()
		ctx.moveTo(this.x, this.y)
		ctx.lineTo(
			this.x + Math.sin(this.angle + this.width / 2) * this.size,
			this.y + Math.cos(this.angle + this.width / 2) * this.size,
		)
		ctx.lineTo(
			this.x + Math.sin(this.angle - this.width / 2) * this.size,
			this.y + Math.cos(this.angle - this.width / 2) * this.size,
		)
		ctx.fill()
	}

	drawFieldOfView(ctx) {
		ctx.globalAlpha = .2
		ctx.fillStyle = this.color
		ctx.beginPath()	

		ctx.moveTo(this.x, this.y)
		ctx.arc(
			this.x,
			this.y,
			this.vision.radius,
			- this.angle + this.vision.radians / 2 - Math.PI / 2,
			- this.angle - this.vision.radians / 2 - Math.PI / 2,
			true
		)
		ctx.moveTo(this.x, this.y)
		ctx.fill()
		ctx.globalAlpha = 1
	}

	update({points, box}) {

		let x = this.x
		let y = this.y

		adjust: {
			this.angularSpeed = this.angularSpeed * .9

			if(box) {
				const wall = this.testWallVisibility(box)
				if(wall) {
					this.angularSpeed += Math.sign(wall.angle || 1) / wall.distance
					break adjust
				}
			}

			if(points) {
				const tooClose = this.findClosest(points)
				if(tooClose) {
					this.angularSpeed += tooClose * this.behaviors['repulsion from individuals']
				}
				const result = this.findGroupDirection(points)
				if(result && result.count > 4) {
					this.angularSpeed += Math.sign(result.angle) * this.behaviors['imitation of direction']
				}
				const direction = this.findDensityDirection(points)
				if(direction) {
					this.angularSpeed += direction * this.behaviors['attraction to group']
				}
			}
		}

		this.angularSpeed = Math.sign(this.angularSpeed) * Math.min(this.maxAngularSpeed, Math.abs(this.angularSpeed))
		this.angle += this.angularSpeed

		x -= Math.sin(this.angle) * this.linearSpeed
		y -= Math.cos(this.angle) * this.linearSpeed

		if(box) {
			if(x < BOUND) x = BOUND
			if(y < BOUND) y = BOUND
			if(x > box.width - BOUND) x = box.width - BOUND
			if(y > box.height - BOUND) y = box.height - BOUND
		}

		this.x = x
		this.y = y
	}

	findClosest(points) {
		const closestLeft = points.filter(point => {
			if(point === this)
				return false
			const distance = Math.sqrt((point.x - this.x)**2 + (point.y - this.y)**2)
			return distance < this.size + point.size
				&& this.testPointVisibility({x: point.x, y: point.y, side: 'left'})
		})
		const closestRight = points.filter(point => {
			if(point === this)
				return false
			const distance = Math.sqrt((point.x - this.x)**2 + (point.y - this.y)**2)
			return distance < this.size + point.size
				&& this.testPointVisibility({x: point.x, y: point.y, side: 'right'})
		})

		if(!closestLeft.length && !closestRight.length)
			return false

		return Math.sign(closestRight.length - closestLeft.length)
	}

	findGroupDirection(points) {
		const inView = points.filter(point => 
			point !== this 
			&& this.testPointVisibility(point)
		)

		if(!inView.length)
			return false

		// const median = circularMedian(inView.map(({angle}) => angle))
		// if(median !== Infinity) {
		// 	return { angle: median, count: inView.length }
		// }

		// weighted by size
		const atan2X = inView.reduce((sum, {angle, size}) => sum + Math.sin(angle) * size, 0) / inView.reduce((sum, {size}) => sum + size, 0)
		const atan2Y = inView.reduce((sum, {angle, size}) => sum + Math.cos(angle) * size, 0) / inView.reduce((sum, {size}) => sum + size, 0)

		const realAngleMean = Math.atan2(atan2X, atan2Y)
		const angleMinus = realAngleMean - this.angle
		const anglePlus = (realAngleMean + Math.PI *2) - this.angle
		const average = Math.abs(angleMinus) < Math.abs(anglePlus) ? angleMinus : anglePlus
		return { angle: average, count: inView.length }
	}

	findDensityDirection(points) {
		const leftView = points.filter(point => 
			point !== this 
			&& this.testPointVisibility({x: point.x, y: point.y, side: 'left'})
		)
		const rightView = points.filter(point => 
			point !== this 
			&& this.testPointVisibility({x: point.x, y: point.y, side: 'right'})
		)
		
		if(!leftView.length && !rightView.length)
			return false

		// weighted by size
		const leftWeight = leftView.reduce((sum, {size}) => sum + size, 0)
		const rightWeight = rightView.reduce((sum, {size}) => sum + size, 0)
		return Math.sign(leftWeight - rightWeight)
	}

	testWallVisibility({height, width}) {
		const futureX = this.x - Math.sin(this.angle) * this.vision.radius
		const futureY = this.y - Math.cos(this.angle) * this.vision.radius

		const returns = []
		if(futureX < BOUND) { // left
			returns.push({
				angle: this.angle / (Math.PI / 2) - 1,
				distance: this.x
			})
		}
		if (futureX > width - BOUND) { // right
			returns.push({
				angle: this.angle / (Math.PI / 2) + 1,
				distance: width - this.x
			})
		}
		if (futureY < BOUND) { // top
			returns.push({
				angle: this.angle / (Math.PI / 2),
				distance: this.y
			})
		}
		if (futureY > height - BOUND) { // bottom
			returns.push({
				angle: this.angle / (Math.PI / 2) - 2,
				distance: height - this.y
			})
		}

		if(returns.length === 0)
			return false

		// cheat
		if(this.x < BOUND * 10 && this.x < BOUND * 10) {
			return {
				angle: this.angularSpeed, 
				distance: Math.min(Math.abs(this.x - BOUND), Math.abs(this.y - BOUND))
			}
		}
		
		returns.sort((a, b) => {
			if (Math.abs(a.distance - b.distance) > BOUND * 2)
				return a.distance > b.distance
			else
				return Math.abs(a.angle - this.angularSpeed) < Math.abs(b.angle - this.angularSpeed)
			
		})

		return returns[0]
	}

	testPointVisibility({x, y, side}) {
		// is point (x,y) in cone of vision (radius,radians) of boid (this)
		const dx = this.x - x
		const dy = this.y - y

		const distance = Math.sqrt(dx**2 + dy**2)
		if(distance > this.vision.radius)
			return false

		const angle = this.angleFromDeltas({dx, dy})
		const deltaAngle = (Math.PI * 2 - this.angle + angle) % (Math.PI * 2)

		if(side === 'left' && deltaAngle > this.vision.radians / 2) {
			return false
		} else if (side === 'right' && deltaAngle < Math.PI * 2 - this.vision.radians / 2) {
			return false
		} else if(!side && deltaAngle > this.vision.radians / 2 && deltaAngle < Math.PI * 2 - this.vision.radians / 2) {
			return false
		}

		return true
	}

	angleFromDeltas({dx, dy}) {
		// TODO: is this a poor man's atan2?
		return Math.atan(dx / dy) 
			+ (dy < 0 ? Math.PI : 0) 
			+ (dy > 0 && dx < 0 ? Math.PI * 2 : 0)
	}
}