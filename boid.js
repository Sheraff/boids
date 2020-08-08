self.importScripts('median.js')

const BOUND = 12.5

/**
 * @typedef {string | CanvasGradient | CanvasPattern} CanvasColor
 */

class Boid {
	/**
	 * @param {Object} options
	 * @param {number?} options.angle
	 * @param {number?} options.x
	 * @param {number?} options.y
	 * @param {CanvasColor?} options.color
	 * @param {number?} options.weight
	 * @param {number?} options.speed
	 */
	constructor({
		angle = 0,
		x = 0,
		y = 0,
		color,
		weight,
		speed,
	}) {
		/** @type {number} - angle in radians (0 < angle < 2𝜋) */
		this.angle = angle

		/** @type {number} */
		this.x = x

		/** @type {number} */
		this.y = y

		const weightBoost = weight ?? (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) / 6
		/** @type {number} - weight in averages */
		this.weight = 1 + weightBoost

		/**
		 * @typedef {object} Vision
		 * @property {number} radius
		 * @property {number} radians - angle in radians (0 < angle < 2𝜋)
		 * @type {Vision}
		 */
		this.vision = {
			radius: 100,
			radians: 5 / 4 * Math.PI
		}

		/** @type {number} */
		this.minLinearSpeed = .2

		/** @type {number} */
		this.linearSpeed = this.minLinearSpeed

		const maxLinearSpeedBoost = speed ?? Math.random()
		/** @type {number} */
		this.maxLinearSpeed = 2 + maxLinearSpeedBoost * 1

		/** @type {number} */
		this.angularSpeed = 0

		const maxAngularSpeedBoost = Math.random()
		/** @type {number} - lower max angular speed leads to more predictable patterns */
		this.maxAngularSpeed = (Math.PI * 2) / 45 * (maxAngularSpeedBoost + 1)

		/**
		 * @typedef {object} BehaviorWeights
		 * @property {number} 'obstacle avoidance'
		 * @property {number} 'repulsion from individuals'
		 * @property {number} 'imitation of direction'
		 * @property {number} 'attraction to group'
		 * @type {BehaviorWeights}
		 */
		this.behaviors = {
			'obstacle avoidance': 2,
			'repulsion from individuals': .2,
			'imitation of direction': .07,
			'attraction to group': .02,
		}

		// graphics
		/** @type {number} - longer => weighs more in averages */
		this.size = 10 + Math.min(2, weightBoost) * 15

		/** @type {number} - narrower => higher top speed */
		this.width = 5 + Math.max(0, 1 - maxLinearSpeedBoost) * 10
		// this.width = Math.min(this.size, this.width)
		
		/** @type {string | CanvasGradient | CanvasPattern} - greener => turns slower */
		this.color = color ?? `rgb(
			${maxAngularSpeedBoost * 180},
			${(1 - maxAngularSpeedBoost) * 180},
			${maxAngularSpeedBoost * 180}
		)`

		/** @type {boolean} - DEBUG: useful to indicate some property*/
		this.wearsHat = false

		/** @type {number} - targets this.angle w/ smoothed out variations */
		this.drawingAngle = this.angle
	}

	/**
	 * @param {number} value
	 */
	set angle(value) {
		if(value < 0)
			this._angle = value % (Math.PI * 2) + Math.PI * 2
		else
			this._angle = value % (Math.PI * 2)

	}

	get angle() {
		return this._angle
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 * @param {{ withField?: boolean }} options 
	 */
	draw(ctx, { withField } = {}) {
		this.updateDrawingAngle()

		const preserveFill = ctx.fillStyle

		if(withField)
			this.drawFieldOfView(ctx)

		if(this.wearsHat)
			this.drawHat(ctx)

		this.drawTriangle(ctx)
		ctx.fillStyle = preserveFill
	}

	updateDrawingAngle() {
		if(this.angle - this.drawingAngle > Math.PI) 
			this.drawingAngle += Math.PI * 2
		else if (this.drawingAngle - this.angle > Math.PI)
			this.drawingAngle -= Math.PI * 2

		const direction = Math.sign(this.angle - this.drawingAngle)
		const difference = Math[direction ? 'min' : 'max'](Math.abs(this.angle - this.drawingAngle), (Math.PI * 2) / 45)
		this.drawingAngle += direction * difference
		this.drawingAngle = this.drawingAngle % (Math.PI * 2)
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 */
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

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 */
	drawTriangle(ctx) {
		ctx.fillStyle = this.color
		ctx.beginPath()
		const drawSize = this.size * .9
		const drawWidth = this.width
		const centerX = Math.sin(this.drawingAngle) * drawSize / 2
		const centerY = Math.cos(this.drawingAngle) * drawSize / 2
		const hypotenuse = Math.sqrt(drawSize**2 + (drawWidth/2)**2)
		const halfAngle = Math.asin(drawWidth / drawSize / 2)
		ctx.moveTo(
			this.x - centerX, 
			this.y - centerY,
		)
		ctx.lineTo(
			this.x + Math.cos(Math.PI / 2 - this.drawingAngle - halfAngle) * hypotenuse - centerX,
			this.y + Math.sin(Math.PI / 2 - this.drawingAngle - halfAngle) * hypotenuse - centerY,
		)
		ctx.lineTo(
			this.x + Math.sin(this.drawingAngle - halfAngle) * hypotenuse - centerX,
			this.y + Math.cos(this.drawingAngle - halfAngle) * hypotenuse - centerY,
		)
		ctx.fill()
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 */
	drawFieldOfView(ctx) {
		ctx.globalAlpha = .07
		ctx.fillStyle = this.color
		ctx.beginPath()	

		ctx.moveTo(this.x, this.y)
		ctx.arc(
			this.x,
			this.y,
			this.vision.radius,
			- this.drawingAngle + this.vision.radians / 2 - Math.PI / 2,
			- this.drawingAngle - this.vision.radians / 2 - Math.PI / 2,
			true
		)
		ctx.moveTo(this.x, this.y)
		ctx.fill()
		ctx.globalAlpha = 1
	}

	/**
	 * @param {Object} options
	 * @param {Array<Boid>} options.points
	 * @param {HTMLCanvasElement} options.box
	 * @param {DOMHighResTimeStamp} options.deltaTime
	 */
	update({points, box, deltaTime}) {
		const timeMultiplier = deltaTime / 15

		let x = this.x
		let y = this.y

		adjust: {
			this.angularSpeed = this.angularSpeed * .9 * timeMultiplier
			this.linearSpeed = Math.min(this.maxLinearSpeed, this.linearSpeed + .03 * timeMultiplier)
			const visiblePoints = points.filter(point => point !== this && this.testPointVisibility(point))

			const wall = this.testWallVisibility(box)
			if(wall) {
				this.angularSpeed += Math.sign(wall.angle || 1) / wall.distance * this.behaviors['obstacle avoidance'] * timeMultiplier
				this.linearSpeed -= .03 * wall.distance / this.vision.radius * timeMultiplier
			}

			const tooClose = this.findClosest(visiblePoints)
			if(tooClose) {
				this.angularSpeed += tooClose * this.behaviors['repulsion from individuals'] * timeMultiplier
				this.linearSpeed -= .03 * timeMultiplier
			}

			const result = this.findGroupDirection(visiblePoints)
			if(result && result.count > 4) {
				this.angularSpeed += Math.sign(result.angle) * this.behaviors['imitation of direction'] * timeMultiplier
			}

			const direction = this.findDensityDirection(visiblePoints)
			if(direction) {
				this.angularSpeed += direction * this.behaviors['attraction to group'] * timeMultiplier
			}
		}

		this.linearSpeed = Math.max(this.minLinearSpeed, Math.min(this.linearSpeed, this.maxLinearSpeed))
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

	/**
	 * @param {Array<Boid>} visiblePoints
	 * @returns {-1 | 1}
	 */
	findClosest(visiblePoints) {
		const closestLeft = visiblePoints.filter(point => {
			if(point === this)
				return false
			const distance = Math.sqrt((point.x - this.x)**2 + (point.y - this.y)**2)
			return distance < this.size + point.size
				&& this.testPointVisibility(point, {side: 'left'})
		})
		const closestRight = visiblePoints.filter(point => {
			if(point === this)
				return false
			const distance = Math.sqrt((point.x - this.x)**2 + (point.y - this.y)**2)
			return distance < this.size + point.size
				&& this.testPointVisibility(point, {side: 'right'})
		})

		if(!closestLeft.length && !closestRight.length)
			return false

		const leftWeight = closestLeft.reduce((sum, {weight}) => sum + weight, 0)
		const rightWeight = closestRight.reduce((sum, {weight}) => sum + weight, 0)

		return Math.sign(rightWeight - leftWeight)
	}

	/**
	 * @param {Array<Boid>} visiblePoints
	 */
	findGroupDirection(visiblePoints) {
		if(!visiblePoints.length)
			return false

		// const median = circularMedian(visiblePoints.map(({angle}) => angle))
		// if(median !== Infinity) {
		// 	const angleMinus = median - this.angle
		// 	const anglePlus = (median + Math.PI *2) - this.angle
		// 	const average = Math.abs(angleMinus) < Math.abs(anglePlus) ? angleMinus : anglePlus
		// 	return { angle: average, count: visiblePoints.length }
		// }

		// average, weighted by size
		const atan2X = visiblePoints.reduce((sum, {angle, weight}) => sum + Math.sin(angle) * weight, 0) / visiblePoints.reduce((sum, {weight}) => sum + weight, 0)
		const atan2Y = visiblePoints.reduce((sum, {angle, weight}) => sum + Math.cos(angle) * weight, 0) / visiblePoints.reduce((sum, {weight}) => sum + weight, 0)

		const realAngleMean = Math.atan2(atan2X, atan2Y)
		const angleMinus = realAngleMean - this.angle
		const anglePlus = (realAngleMean + Math.PI *2) - this.angle
		const average = Math.abs(angleMinus) < Math.abs(anglePlus) ? angleMinus : anglePlus
		return { angle: average, count: visiblePoints.length }
	}

	/**
	 * @param {Array<Boid>} visiblePoints
	 * @returns {-1 | 1}
	 */
	findDensityDirection(visiblePoints) {
		const leftView = visiblePoints.filter(point => this.testPointVisibility(point, {side: 'left'}))
		const rightView = visiblePoints.filter(point => this.testPointVisibility(point, {side: 'right'}))
		
		if(!leftView.length && !rightView.length)
			return false

		// weighted by size
		const leftWeight = leftView.reduce((sum, {weight}) => sum + weight, 0)
		const rightWeight = rightView.reduce((sum, {weight}) => sum + weight, 0)
		return Math.sign(leftWeight - rightWeight)
	}

	/**
	 * @typedef {Object} WallInView
	 * @property {number} angle
	 * @property {number} distance
	 * 
	 * @param {HTMLCanvasElement}
	 * @returns {false | WallInView}
	 */
	testWallVisibility({height, width}) {
		const futureX = this.x - Math.sin(this.angle) * this.vision.radius
		const futureY = this.y - Math.cos(this.angle) * this.vision.radius

		/** @type Array<WallInView> */
		const returns = []
		if(futureX < BOUND) { // left
			returns.push({
				angle: this.angle / (Math.PI / 2) - 1,
				distance: this.x - BOUND
			})
		}
		if (futureX > width - BOUND) { // right
			returns.push({
				angle: this.angle / (Math.PI / 2) + 1,
				distance: width - this.x - BOUND
			})
		}
		if (futureY < BOUND) { // top
			returns.push({
				angle: this.angle / (Math.PI / 2),
				distance: this.y - BOUND
			})
		}
		if (futureY > height - BOUND) { // bottom
			returns.push({
				angle: this.angle / (Math.PI / 2) - 2,
				distance: height - this.y - BOUND
			})
		}

		if(returns.length === 0)
			return false

		if(returns.length === 1)
			return returns[0]

		// cheat
		if(this.x < BOUND * 10 && this.y < BOUND * 10) {
			return {
				angle: this.angularSpeed, 
				distance: Math.min(Math.abs(this.x - BOUND), Math.abs(this.y - BOUND))
			}
		}
		
		returns.sort((a, b) => {
			if (Math.abs(a.distance - b.distance) > BOUND * 2)
				return a.distance > b.distance
			else
				return this.absoluteAngleDifference(a.angle, this.angle) < this.absoluteAngleDifference(b.angle, this.angle)
			
		})

		return returns[0]
	}

	/**
	 * is point (x,y) in cone of vision (radius,radians) of boid (this)
	 * @param {Boid} point
	 * @param {Object} options
	 * @param {'left' | 'right'} options.side - side to include in the cone of vision, defaults to 'both'
	 */
	testPointVisibility(point, {side} = {}) {
		const dx = this.x - point.x
		const dy = this.y - point.y

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

	/**
	 * @param {Object} vector
	 * @param {number} vector.dx
	 * @param {number} vector.dy
	 */
	angleFromDeltas({dx, dy}) {
		// TODO: is this a poor man's atan2?
		return Math.atan(dx / dy) 
			+ (dy < 0 ? Math.PI : 0) 
			+ (dy > 0 && dx < 0 ? Math.PI * 2 : 0)
	}

	/**
	 * 
	 * @param {number} alpha 
	 * @param {number} beta 
	 */
	absoluteAngleDifference(alpha, beta) {
		const phi = Math.abs(beta - alpha) % (Math.PI * 2)
		const distance = phi > Math.PI 
			? Math.PI * 2 - phi 
			: phi
		return distance
	}
}