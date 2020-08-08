#[path = "./boid.rs"]
mod boid;

pub struct Universe {
	canvas: boid::Canvas,
	boids: Vec<boid::Boid>,
	context: web_sys::CanvasRenderingContext2d
}

impl Universe {

	pub fn new(context: web_sys::CanvasRenderingContext2d, height: f64, width: f64) -> Universe {
		let canvas = boid::Canvas {
			height,
			width,
			padding: 10.0
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

	pub fn tick(&mut self) {
		// let boids = grid_split(&self.canvas, &self.boids);
		// for boid in self.boids {
		// 	boid.update(&self.canvas, boids, 1.0);
		// }
		self.boids[0].update(&self.canvas, vec![], 1.0);
	}

	pub fn render(&self) {
		self.boids[0].draw(&self.canvas, &self.context);
	}
}

fn grid_split<'a>(canvas: &boid::Canvas, boids: &'a Vec<boid::Boid>) -> Vec<&'a boid::Boid> {
	// TODO
	let borrowed_boids: Vec<&boid::Boid> = boids
		.iter()
		.collect();
	borrowed_boids
}