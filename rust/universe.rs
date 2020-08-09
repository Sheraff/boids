use std::collections::HashMap;

#[path = "boid.rs"]
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
		let clone = self.boids.clone();
		let references: Vec<&boid::Boid> = clone.iter().collect();
		let (boids_map, boids_cells) = grid_split(&self.canvas, references);
		let empty = Vec::new();
		for boid in self.boids.iter_mut() {
			let boids = match boids_map.get(&boid.id) {
				Some((col, row)) => &boids_cells[*col][*row],
				None => &empty
			};
			
			boid.update(&self.canvas, &boids, delta_time / 15.0);
		}
	}

	pub fn render(&self) {
		self.context.clear_rect(0.0, 0.0, self.canvas.width, self.canvas.height);
		for boid in self.boids.iter() {
			boid.draw(&self.canvas, &self.context);
		}
	}
}

fn grid_split<'a>(canvas: &boid::Canvas, boids: Vec<&'a boid::Boid>) -> (HashMap<u32, (usize, usize)>, Vec<Vec<Vec<&'a boid::Boid>>>) {
	let max_vision_range = boids
		.clone()
		.iter()
		.map(|boid| boid.vision.radius)
		.fold(0./0., f64::max)
		.max(1.0);
	let nb_columns = (canvas.width / max_vision_range).ceil() as i32;
	let nb_rows = (canvas.height / max_vision_range).ceil() as i32;
	
	let mut cells = vec![vec![Vec::new(); nb_rows as usize]; nb_columns as usize];
	let mut map = HashMap::new();

	for boid in boids {
		let max_x = boid.point.x.min(canvas.width);
		let column = (max_x / max_vision_range).floor() as i32;

		let max_y = boid.point.y.min(canvas.height);
		let row = (max_y / max_vision_range).floor() as i32;

		for delta_column in &[-1, 0, 1] {
			for delta_row in &[-1, 0, 1] {
				let target_column = column + delta_column;
				if target_column < 0 || target_column >= nb_columns {
					continue;
				}
				let target_row = row + delta_row;
				if target_row < 0 || target_row >= nb_rows {
					continue;
				}
				cells[target_column as usize][target_row as usize].push(boid)
			}
		}

		map.insert(boid.id, (column as usize, row as usize));
	}

	(map, cells)
}