
mod boid;

fn main() {
	println!("Hello, World!");

	let canvas = boid::Canvas {
		width: 1000.0,
		height: 1000.0,
		padding: 10.0
	};
	let mut boid = boid::Boid::new();
	boid.set_all_initial(&canvas);
	let mut all_boids: Vec<boid::Boid> = vec![];
	all_boids.push(boid::Boid::new());
	all_boids.push(boid::Boid::new());
	let borrowed_boids: Vec<&boid::Boid> = all_boids
		.iter()
		.collect();

	boid.update(&canvas, borrowed_boids, 1.0);
	boid.update_drawing_angle(1.0);
	boid.get_drawing_data();
	
	// let timer = timer::Timer::new();
	// let _guard = timer.schedule_repeating(1, boid.update(&canvas, borrowed_boids));
}