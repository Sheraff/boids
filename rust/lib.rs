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

#[wasm_bindgen]
pub fn send_context(ctx: web_sys::CanvasRenderingContext2d, height: f64, width: f64) {
	let mut universe = universe::Universe::new(ctx, height, width);
	universe.tick();
	universe.render();
	log("oyo");
}

#[wasm_bindgen]
pub fn request_frame() {
	log("coucou");
}

#[wasm_bindgen(start)]
pub fn main() {
    log("alive !!");
}
