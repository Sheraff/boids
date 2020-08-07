use std::f64::consts::PI;

fn main() {
	println!("Hello, World!");
	let alpha = 0.0;
	let beta = PI / 2.0;
	let diff = absolute_angle_difference(alpha, beta);
	println!("result: {}", diff);
	let mut boid = Boid::new();
	let canvas = Canvas {
		width: 1000.0,
		height: 1000.0,
		padding: 10.0
	};
	let mut all_boids: Vec<Boid> = vec![];
	all_boids.push(Boid::new());
	all_boids.push(Boid::new());
	let borrowed_boids = all_boids
		.iter()
		.collect();
	boid.update(&canvas, borrowed_boids);
}

struct Point {
	x: f64,
	y: f64
}

struct Cone {
	radius: f64,
	radians: f64
}

struct Speed {
	min: f64,
	max: f64,
	value: f64
}

struct Boid {
	point: Point,
	vision: Cone,
	angle: Angle,
	weight: f64,
	angular_speed: Speed,
	linear_speed: Speed,
}

struct Canvas {
	width: f64,
	height: f64,
	padding: f64
}


struct Angle {
	value: f64
}
impl Angle {
	fn new(value: f64) -> Angle {
		Angle { value: Angle::modulo(value) }
	}

	fn set(&mut self, new_value: f64) {
		self.value = Angle::modulo(new_value);
	}

	fn get(&self) -> f64{
		self.value
	}

	fn modulo(value: f64) -> f64 {
		if value < 0.0 {
			value % (PI * 2.0) + PI * 2.0
		} else {
			value % (PI * 2.0)
		}
	}
}




impl Boid {

	fn new() -> Boid {
		Boid {
			point: Point {
				x: 10.0, 
				y: 30.0
			},
			vision: Cone {
				radius: PI,
				radians: 100.0
			},
			angle: Angle::new(PI / 2.0),
			weight: 1.0,
			angular_speed: Speed {
				min: 0.0,
				max: 10.0,
				value: 1.0
			},
			linear_speed: Speed {
				min: 0.0,
				max: 10.0,
				value: 1.0
			}
		}
	}

	fn update(&mut self, canvas: &Canvas, boids: Vec<&Boid>) {
		// default update speeds
		self.angular_speed.value = self.angular_speed.value * 0.9;
		self.linear_speed.value = self.linear_speed.value + 0.03;
		
		// environment update speeds
		let visible_points = self.filter_points_by_visibility(boids);
		
		// cap speeds
		self.angular_speed.value = self.angular_speed.value.signum() * self.angular_speed.value.abs().min(self.angular_speed.max).max(self.angular_speed.min);
		self.linear_speed.value = self.linear_speed.value.min(self.linear_speed.max).max(self.angular_speed.min);

		// default update positions
		self.angle.set(self.angle.get() + self.angular_speed.value);
		self.point.x = self.point.x - self.angle.get().sin() * self.linear_speed.value;
		self.point.y = self.point.y - self.angle.get().cos() * self.linear_speed.value;

		// cap positions
		self.point.x = self.point.x.max(canvas.padding).min(canvas.width - canvas.padding);
		self.point.y = self.point.y.max(canvas.padding).min(canvas.height - canvas.padding);
	}

	fn filter_points_by_visibility<'a>(&self, boids: Vec<&'a Boid>) -> Vec<&'a Boid> {
		boids
			.iter()
			.filter(|boid| self.test_point_visibility(&boid.point))
			.map(|&boid| boid)
			.collect()
	}

	fn test_point_visibility(&self, point: &Point) -> bool {
		let dx = self.point.x - point.x;
		let dy = self.point.y - point.y;
	
		let distance = dx.powi(2) + dy.powi(2);
		if distance > self.vision.radius.powi(2) {
			return false
		}
	
		let angle = angle_from_deltas(dx, dy);
		let delta_angle = (PI * 2.0 - self.angle.get() + angle) % (PI * 2.0);
	
		delta_angle < self.vision.radians / 2.0 || delta_angle > PI * 2.0 - self.vision.radians / 2.0
	}
}

fn angle_from_deltas(dx: f64, dy: f64) -> f64 {
	let unsigned_angle = (dx / dy).atan();
	if dx < 0.0 {
		unsigned_angle + PI
	} else if dx < 0.0 {
		unsigned_angle + PI * 2.0
	} else {
		unsigned_angle
	}
}

fn absolute_angle_difference(alpha: f64, beta: f64) -> f64 {
	let phi = (beta - alpha).abs() % (PI * 2.0);
	if phi > PI {
		PI * 2.0 - phi
	} else {
		phi
	}
}