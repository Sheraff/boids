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


static mut UNIVERSE: Option<universe::Universe> = None;

#[wasm_bindgen]
pub fn send_context(ctx: web_sys::CanvasRenderingContext2d, height: f64, width: f64) {
	unsafe {
		UNIVERSE = Some(universe::Universe::new(ctx, height, width));
		
	}
}

#[wasm_bindgen]
pub fn get_boids_count() -> u32 {
	unsafe {
		UNIVERSE.as_mut().unwrap().boids.len() as u32
	}
}

#[wasm_bindgen]
pub fn request_frame(delta_time: f64) {
	unsafe {
		UNIVERSE.as_mut().unwrap().tick(delta_time);
		UNIVERSE.as_mut().unwrap().render();
	}
}

#[wasm_bindgen(start)]
pub fn main() {
    log("alive !!");
}
