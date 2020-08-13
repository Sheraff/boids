use wasm_bindgen::prelude::*;
mod universe;

use std::cell::RefCell;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(js_namespace = console)]
	fn log(s: &str);

	#[wasm_bindgen(js_namespace = console, js_name = log)]
	fn log_u32(a: u32);
	
	#[wasm_bindgen(js_namespace = console, js_name = log)]
	fn log_f64(a: f64);

	#[wasm_bindgen(js_namespace = console, js_name = log)]
	fn log_f64_f64(a: f64, b: f64);
}

#[wasm_bindgen]
pub fn console_log(s: &str) {
	log(s);
}

#[wasm_bindgen(module = "/js/interop.js")]
extern "C" {
	#[wasm_bindgen(js_name = sendMessage)]
	fn send_message(s: &str);
	
	#[wasm_bindgen(js_name = sendMessage)]
	fn send_key_value(s: &str, v: f64);
}

thread_local! {
	pub static UNIVERSE: RefCell<Option<universe::Universe>> = RefCell::new(None);
}

#[wasm_bindgen]
pub fn send_context(ctx: web_sys::CanvasRenderingContext2d, width: f64, height: f64) {
	UNIVERSE.with(|universe| {
		*universe.borrow_mut() = Some(universe::Universe::new(ctx, width, height));
	});
	send_message("coucou interop");
}

#[wasm_bindgen]
pub fn get_boids_count() -> u32 {
	UNIVERSE.with(|universe| {
		universe.borrow().as_ref().unwrap().boids.len() as u32
	})
}

#[wasm_bindgen]
pub fn add_one_boid(x: f64, y: f64) -> u32 {
	UNIVERSE.with(|universe| {
		let mut option = universe.borrow_mut();
		let universe = option.as_mut().unwrap();
		universe.add_one_boid_xy(x, y);
		universe.boids.len() as u32
	})
}

#[wasm_bindgen]
pub fn set_canvas_dimensions(width: f64, height: f64) {
	UNIVERSE.with(|universe| {
		let mut option = universe.borrow_mut();
		let universe = option.as_mut().unwrap();
		universe.canvas.width = width;
		universe.canvas.height = height;
	})
}

#[wasm_bindgen]
pub fn request_tick(delta_time: f64, debug: bool) {
	UNIVERSE.with(|universe| {
		let mut option = universe.borrow_mut();
		let universe = option.as_mut().unwrap();
		let frames = delta_time / 15.0;
		universe.tick(frames, debug);
	});
	send_key_value("tick", delta_time);
}

#[wasm_bindgen]
pub fn request_frame(delta_time: f64, draw_field_of_view: bool, debug: bool) {
	UNIVERSE.with(|universe| {
		let mut option = universe.borrow_mut();
		let universe = option.as_mut().unwrap();
		universe.render(draw_field_of_view, debug);
	});
	send_key_value("frame", delta_time);
}

#[wasm_bindgen(start)]
pub fn main() {
	log("alive !!");
}
