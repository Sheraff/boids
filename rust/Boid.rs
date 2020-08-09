use std::f64::consts::PI;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

pub struct Canvas {
	pub width: f64,
	pub height: f64,
	pub padding: f64
}

#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(js_namespace = console)]
	fn log(s: &str);

	#[wasm_bindgen(js_namespace = console, js_name = log)]
	fn log_f64(a: f64);

	#[wasm_bindgen(js_namespace = Math)]
	fn random() -> f64;
}

#[derive(Clone)]
pub struct Point {
	pub x: f64,
	pub y: f64
}

#[derive(Clone)]
pub struct Cone {
	pub radius: f64,
	pub radians: f64
}

#[derive(Clone)]
struct Speed {
	min: f64,
	max: f64,
	value: f64
}

#[derive(Clone)]
struct Body {
	size: f64,
	width: f64,
	color: String,
	angle: f64
}

static mut ID_COUNT: u32 = 0;

#[derive(Clone)]
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

	fn get(&self) -> f64 {
		self.value
	}

	fn sin(&self) -> f64 {
		self.value.sin()
	}

	fn cos(&self) -> f64 {
		self.value.cos()
	}

	fn modulo(value: f64) -> f64 {
		if value < 0.0 {
			value % (PI * 2.0) + PI * 2.0
		} else {
			value % (PI * 2.0)
		}
	}
}
impl std::ops::AddAssign<f64> for Angle {
	fn add_assign(&mut self, other: f64) {
		self.value = Angle::modulo(self.value + other);
	}
}

enum Side {
	Both,
	Left,
	Right
}

#[derive(Clone)]
pub struct Boid {
	pub id: u32,
	pub point: Point,
	pub vision: Cone,
	angle: Angle,
	weight: f64,
	angular_speed: Speed,
	linear_speed: Speed,
	body: Body
}

impl Boid {
	pub fn new() -> Boid {
		let id: u32;
		unsafe {
			ID_COUNT += 1;
			id = ID_COUNT;
		}
		Boid {
			id,
			point: Point {
				x: 0.0, 
				y: 0.0
			},
			vision: Cone {
				radius: 0.0,
				radians: 0.0
			},
			angle: Angle::new(0.0),
			weight: 0.0,
			angular_speed: Speed {
				min: 0.0,
				max: 0.0,
				value: 0.0
			},
			linear_speed: Speed {
				min: 0.0,
				max: 0.0,
				value: 0.0
			},
			body: Body {
				size: 0.0,
				width: 0.0,
				color: String::new(),
				angle: 0.0
			}
		}
	}

	pub fn set_initial_weight(&mut self, weight_boost: f64) {
		self.weight = 1.0 + weight_boost;
		self.body.size = 10.0 + random().min(2.0) * 15.0;
	}

	pub fn set_initial_coordinates(&mut self, x: f64, y: f64) {
		self.point.x = x;
		self.point.y = y;
	}

	pub fn set_initial_angle(&mut self, angle: f64) {
		self.angle.set(angle);
		self.body.angle = self.angle.get();
	}

	pub fn set_initial_vision(&mut self, radius: f64, radians: f64) {
		self.vision.radius = radius;
		self.vision.radians = radians;
	}

	pub fn set_max_linear_speed(&mut self, speed: f64) {
		self.linear_speed.min = 0.2;
		self.linear_speed.value = self.linear_speed.min;
		self.linear_speed.max = 2.0 + speed * 1.0;
		self.body.width = 5.0 + (1.0 - speed).max(0.0) * 10.0;
	}

	pub fn set_max_angular_speed(&mut self, speed: f64) {
		self.angular_speed.min = 0.0;
		self.angular_speed.value = 0.0;
		self.angular_speed.max = PI * 2.0 / 45.0 * (speed + 1.0);
		if self.body.color.is_empty() {
			let purple = (speed * 180.0).round() as i32;
			let green = ((1.0 - speed) * 180.0).round() as i32;
			self.body.color = format!("rgb({},{},{})", purple, green, purple);
		}
	}

	pub fn set_all_initial(&mut self, canvas: &Canvas) {
		if self.weight == 0.0 { self.set_initial_weight(random()); }
		if self.point.x == 0.0 && self.point.y == 0.0 { self.set_initial_coordinates(random() * canvas.width, random() * canvas.height); }
		if self.angle.get() == 0.0 { self.set_initial_angle(random() * PI * 2.0); }
		if self.vision.radius == 0.0 || self.vision.radians == 0.0 { self.set_initial_vision(100.0, 1.25 * PI); }
		if self.linear_speed.max == 0.0 { self.set_max_linear_speed(random()); }
		if self.angular_speed.max == 0.0 { self.set_max_angular_speed(random()); }
	}

	pub fn update(&mut self, canvas: &Canvas, boids: &Vec<&Boid>, frames: f64) {
		// default update speeds
		self.angular_speed.value *= (0.9_f64).powf(frames);
		self.linear_speed.value += 0.03 * frames;
		
		// environment update speeds
		let (sees_wall, wall_angle, wall_distance) = self.test_wall_visibility(canvas);
		if sees_wall {
			self.angular_speed.value += wall_angle.signum() / wall_distance * 2.0 * frames;
			self.linear_speed.value -= 0.03 * wall_distance / self.vision.radius * frames;
		}

		let visible_points = self.filter_points_by_visibility(boids, &Side::Both);
		let (too_close, direction) = self.find_closest_direction(&visible_points);
		if too_close {
			self.angular_speed.value += direction * 0.2 * frames;
			self.linear_speed.value -= 0.03 * frames;
		}

		let (sees_group, angle, count) = self.find_group_direction(&visible_points);
		if sees_group && count > 4 {
			self.angular_speed.value += angle.signum() * 0.07 * frames;
		}

		let (sees_group, direction) = self.find_density_direction(&visible_points);
		if sees_group {
			self.angular_speed.value += direction * 0.02 * frames;
		}
		
		// cap speeds
		self.angular_speed.value = self.angular_speed.value.signum() * self.angular_speed.value.abs().min(self.angular_speed.max).max(self.angular_speed.min);
		self.linear_speed.value = self.linear_speed.value.min(self.linear_speed.max).max(self.angular_speed.min);

		// default update positions
		self.angle += self.angular_speed.value;
		self.point.x -= self.angle.sin() * self.linear_speed.value;
		self.point.y -= self.angle.cos() * self.linear_speed.value;

		// cap positions
		self.point.x = self.point.x.max(canvas.padding).min(canvas.width - canvas.padding);
		self.point.y = self.point.y.max(canvas.padding).min(canvas.height - canvas.padding);
	}

	fn filter_points_by_visibility<'a>(&self, boids: &Vec<&'a Boid>, side: &Side) -> Vec<&'a Boid> {
		boids
			.clone()
			.iter()
			.filter(|boid| self.id != boid.id && self.test_point_visibility(&boid.point, side))
			.map(|&boid| boid)
			.collect()
	}

	fn test_point_visibility(&self, point: &Point, side: &Side) -> bool {
		let dx = self.point.x - point.x;
		let dy = self.point.y - point.y;
	
		let distance = dx.powi(2) + dy.powi(2);
		if distance > self.vision.radius.powi(2) {
			return false
		}
	
		let angle = angle_from_deltas(dx, dy);
		let delta_angle = (PI * 2.0 - self.angle.get() + angle) % (PI * 2.0);
	
		match side {
			Side::Both => delta_angle < self.vision.radians / 2.0 || delta_angle > PI * 2.0 - self.vision.radians / 2.0,
			Side::Left => delta_angle < self.vision.radians / 2.0,
			Side::Right => delta_angle > PI * 2.0 - self.vision.radians / 2.0
		}
	}

	/// Of the Boids too close, are there more on the Left or on the Right
	/// return direction in which to turn to get away
	fn find_closest_direction(&self, boids: &Vec<&Boid>) -> (bool, f64) {
		let too_close: Vec<&Boid> = boids
			.iter()
			.filter(|boid| {
				let distance = ((boid.point.x - self.point.x).powi(2) + (boid.point.y - self.point.y).powi(2)).sqrt();
				distance < self.body.size + boid.body.size
			})
			.map(|&boid| boid)
			.collect();
		if too_close.len() == 0 {
			return (false, 0.0)
		}

		let too_close_left: Vec<&Boid> = too_close.iter().filter(|boid| self.test_point_visibility(&boid.point, &Side::Left)).map(|&boid| boid).collect();
		let too_close_right: Vec<&Boid> = too_close.iter().filter(|boid| self.test_point_visibility(&boid.point, &Side::Right)).map(|&boid| boid).collect();
		if too_close_left.len() == 0 && too_close_right.len() == 0 {
			return (false, 0.0)
		}

		let left_weight = too_close_left.iter().fold(0.0, |sum, x| sum + x.weight);
		let right_weight = too_close_right.iter().fold(0.0, |sum, x| sum + x.weight);

		(true, (right_weight - left_weight).signum())
	}

	/// Average angle of a vector of Boids
	fn find_group_direction(&self, boids: &Vec<&Boid>) -> (bool, f64, usize) {
		let length = boids.len();
		if boids.len() == 0 {
			return (false, 0.0, 0)
		}

		let total_weight = boids.iter().fold(0.0, |sum, x| sum + x.weight);
		let atan2_x = boids.iter().fold(0.0, |sum, x| sum + x.angle.sin() * x.weight) / total_weight;
		let atan2_y = boids.iter().fold(0.0, |sum, x| sum + x.angle.cos() * x.weight) / total_weight;
		let angle_mean = atan2_x.atan2(atan2_y);

		let lesser_diff = angle_mean - self.angle.get();
		let greater_diff = angle_mean + PI * 2.0 - self.angle.get();
		let return_diff = if lesser_diff.abs() < greater_diff.abs() { lesser_diff } else { greater_diff };

		(true, return_diff, length)
	}

	/// Are there more Boids on the Left or on the Right 
	/// return direction in which to turn to get closer
	fn find_density_direction(&self, boids: &Vec<&Boid>) -> (bool, f64) {
		let left_view = self.filter_points_by_visibility(boids, &Side::Left);
		let right_view = self.filter_points_by_visibility(boids, &Side::Right);

		if left_view.len() == 0 && right_view.len() == 0 {
			return (false, 0.0)
		}

		let left_weight = left_view.iter().fold(0.0, |sum, x| sum + x.weight);
		let right_weight = right_view.iter().fold(0.0, |sum, x| sum + x.weight);

		(true, (left_weight - right_weight).signum())
	}

	fn test_wall_visibility(&self, canvas: &Canvas) -> (bool, f64, f64) {
		let future_x = self.point.x - self.angle.sin() * self.vision.radius;
		let future_y = self.point.y - self.angle.cos() * self.vision.radius;
		let mut returns: Vec<(f64, f64)> = vec![];
		let mut count = 0;

		if future_x < canvas.padding { // left
			count = count + 1;
			returns.push((
				Angle::modulo(self.angle.get() / (PI / 2.0) - 1.0),
				self.point.x - canvas.padding
			));
		}
		if future_x > canvas.width - canvas.padding { // right
			count = count + 1;
			returns.push((
				Angle::modulo(self.angle.get() / (PI / 2.0) - 3.0),
				canvas.width - canvas.padding - self.point.x
			));
		}
		if future_y < canvas.padding { // top
			count = count + 1;
			returns.push((
				Angle::modulo(self.angle.get() / (PI / 2.0)),
				self.point.y - canvas.padding
			));
		}
		if future_y > canvas.height - canvas.padding { // bottom
			count = count + 1;
			returns.push((
				Angle::modulo(self.angle.get() / (PI / 2.0) - 2.0),
				canvas.height - canvas.padding - self.point.y
			));
		}

		if count == 0 {
			return (false, 0.0, 0.0)
		} else if count == 1 {
			return (true, returns[0].0, returns[0].1)
		} else {
			// cheat
			if self.point.x < canvas.padding * 10.0 && self.point.y < canvas.padding * 10.0 {
				return (
					true,
					self.angular_speed.value,
					(self.point.x - canvas.padding).abs().min((self.point.y - canvas.padding).abs())
				)
			}

			returns
				.sort_unstable_by(|a, b| if (a.1 - b.1).abs() > canvas.padding * 2.0 {
					a.1.partial_cmp(&b.1).unwrap()
				} else {
					let a_angle_diff = absolute_angle_difference(a.0, self.angle.get());
					let b_angle_diff = absolute_angle_difference(b.0, self.angle.get());
					b_angle_diff.partial_cmp(&a_angle_diff).unwrap()
				});

			return (true, returns[0].0, returns[0].1)
		}
	}

	pub fn update_drawing_angle(&mut self, frames: f64) {
		if self.angle.get() - self.body.angle > PI {
			self.body.angle += PI * 2.0;
		} else if self.body.angle - self.angle.get() > PI {
			self.body.angle -= PI * 2.0;
		}

		let direction = (self.angle.get() - self.body.angle).signum();
		let difference = (self.angle.get() - self.body.angle).abs();
		let limit = PI * 2.0 / 45.0 * frames;
		let capped_diff = if direction > 0.0 { difference.min(limit) } else { difference.max(limit) };
		self.body.angle += direction * capped_diff;
		self.body.angle %= PI * 2.0;
	}

	pub fn get_drawing_data(&self) -> ((f64, f64), (f64, f64), (f64, f64)) {
		let draw_size = self.body.size * 0.9;
		let draw_width = self.body.width * 1.0;
		let center_x = self.body.angle.sin() * draw_size / 2.0;
		let center_y = self.body.angle.cos() * draw_size / 2.0;
		let hypotenuse = (draw_size.powi(2) + (draw_width / 2.0).powi(2)).sqrt();
		let half_angle = (draw_width / draw_size / 2.0).asin();
		(
			(
				self.point.x - center_x,
				self.point.y - center_y
			),
			(
				self.point.x + (PI / 2.0 - self.body.angle - half_angle).cos() * hypotenuse - center_x,
				self.point.y + (PI / 2.0 - self.body.angle - half_angle).sin() * hypotenuse - center_y
			),
			(
				self.point.x + (self.body.angle - half_angle).sin() * hypotenuse - center_x,
				self.point.y + (self.body.angle - half_angle).cos() * hypotenuse - center_y
			)
		)
	}

	pub fn draw(&mut self, canvas: &Canvas, context: &web_sys::CanvasRenderingContext2d, frames: f64) {
		self.update_drawing_angle(frames);
		let data = self.get_drawing_data();
		context.set_fill_style(&JsValue::from_str(&self.body.color));
		context.begin_path();
		context.move_to((data.0).0, (data.0).1);
		context.line_to((data.1).0, (data.1).1);
		context.line_to((data.2).0, (data.2).1);
		context.fill();

	}
}

fn angle_from_deltas(dx: f64, dy: f64) -> f64 {
	let unsigned_angle = (dx / dy).atan();
	if dy < 0.0 {
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