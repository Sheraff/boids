#[path = "./boid.rs"]
mod boid;

pub struct Universe {
	canvas: boid::Canvas,
	pub boids: Vec<boid::Boid>,
	context: web_sys::CanvasRenderingContext2d
}

impl Universe {

	pub fn new(context: web_sys::CanvasRenderingContext2d, height: f64, width: f64) -> Universe {
		let canvas = boid::Canvas {
			height,
			width,
			padding: 12.5
		};

		let mut boids: Vec<boid::Boid> = vec![];

		for _ in 1..200 {
			let mut boid = boid::Boid::new();
			boid.set_all_initial(&canvas);
			boids.push(boid);
		}

		Universe {
			canvas,
			boids,
			context
		}
	}

	pub fn tick(&mut self, delta_time: f64) {
		let boids = grid_split(&self.canvas, &self.boids);
		// let boids: &[boid::Boid] = &self.boids;
		for mut boid in self.boids.iter_mut() {
			// let borrowed_boids: Vec<&boid::Boid> = self.boids
			// 	.iter()
			// 	.collect();
			boid.update(&self.canvas, &vec![], delta_time / 15.0);
		}
		// self.boids[0].update(&self.canvas, vec![], 1.0);
	}

	pub fn render(&self) {
		self.context.clear_rect(0.0, 0.0, self.canvas.width, self.canvas.height);
		for boid in self.boids.iter() {
			boid.draw(&self.canvas, &self.context);
		}
	}
}

fn grid_split<'a>(canvas: &boid::Canvas, boids: &'a Vec<boid::Boid>) -> Vec<&'a boid::Boid> {
	// TODO
	// let max_vision_range = boids
	// 	.iter()
	// 	.map(|&boid| boid.vision.radius)
	// 	.max();
	boids
		.iter()
		.collect()
}