use std::collections::HashMap;

// #[path = "Boid_uses_Angle.rs"]
#[path = "Boid.rs"]
mod boid;

pub struct Universe {
	pub canvas: boid::Canvas,
	pub boids: Vec<boid::Boid>,
	context: web_sys::CanvasRenderingContext2d
}

impl Universe {

	pub fn new(context: web_sys::CanvasRenderingContext2d, width: f64, height: f64) -> Universe {
		let canvas = boid::Canvas {
			width,
			height,
			padding: 12.5
		};

		let mut boids: Vec<boid::Boid> = vec![];

		for _ in 0..200 {
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

	pub fn tick(&mut self, frames: f64, debug: bool) {
		let clone = self.boids.clone();
		let references: Vec<&boid::Boid> = clone.iter().collect();
		let (boids_map, boids_cells) = grid_split(&self.canvas, references);
		let empty = Vec::new();
		for boid in self.boids.iter_mut() {
			let boids = boids_map.get(&boid.id).map_or(
				&empty, 
				|(col, row)| &boids_cells[*col][*row]
			);
			
			boid.update(&self.canvas, &boids, frames);
		}

		if debug {
			let boid = &mut self.boids[0];
			let empty = Vec::new();
			boid.draw_connections(&self.context, &(
				boids_map.get(&boid.id).map_or(
					&empty, 
					|(col, row)| &boids_cells[*col][*row]
				).to_owned()
			));
		}
	}

	pub fn render(&mut self, draw_field_of_view: bool, debug: bool) {
		self.context.clear_rect(0.0, 0.0, self.canvas.width, self.canvas.height);
		for (i, boid) in self.boids.iter().enumerate() {
			boid.draw(&self.context, draw_field_of_view || (i == 0 && debug));
		}
	}

	pub fn add_one_boid_xy(&mut self, x: f64, y: f64) {
		let mut boid = boid::Boid::new();
		boid.set_initial_coordinates(x, y);
		boid.set_all_initial(&self.canvas);
		boid.body.color = String::from("red");
		self.boids.push(boid);
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