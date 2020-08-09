use wasm_bindgen::prelude::*;
mod universe;

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


static mut UNIVERSE: Option<universe::Universe> = None;

#[wasm_bindgen]
pub fn send_context(ctx: web_sys::CanvasRenderingContext2d, height: f64, width: f64) {
	unsafe {
		UNIVERSE = Some(universe::Universe::new(ctx, height, width));
	}
	send_message("coucou interop");
}

#[wasm_bindgen]
pub fn get_boids_count() -> u32 {
	unsafe {
		UNIVERSE.as_mut().unwrap().boids.len() as u32
	}
}

#[wasm_bindgen]
pub fn add_one_boid(x: f64, y: f64) -> u32 {
	unsafe {
		let universe = UNIVERSE.as_mut().unwrap();
		universe.add_one_boid_xy(x, y);
		universe.boids.len() as u32
	}
}

#[wasm_bindgen]
pub fn set_canvas_dimensions(width: f64, height: f64) {
	unsafe {
		let universe = UNIVERSE.as_mut().unwrap();
		universe.canvas.width = width;
		universe.canvas.height = height;
	}
}

#[wasm_bindgen]
pub fn request_tick(delta_time: f64) {
	unsafe {
		let frames = delta_time / 15.0;
		UNIVERSE.as_mut().unwrap().tick(frames);
	}
	send_key_value("tick", delta_time);
}

#[wasm_bindgen]
pub fn request_frame(delta_time: f64) {
	unsafe {
		UNIVERSE.as_mut().unwrap().render();
	}
	send_key_value("frame", delta_time);
}

#[wasm_bindgen(start)]
pub fn main() {
	log("alive !!");
}
