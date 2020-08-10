# Implementation of [Boids](https://en.wikipedia.org/wiki/Boids)

Boids is an example of emergent behavior; that is, the complexity of Boids arises from the interaction of individual agents (the boids, in this case) adhering to a set of simple rules. The rules applied in the simplest Boids world are as follows:

- separation: steer to avoid crowding local flockmates
- alignment: steer towards the average heading of local flockmates
- cohesion: steer to move towards the average position (center of mass) of local flockmates

## JS version 

Uses basic web worker for computation, w/ [`OffscreenCanvas`](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) to draw on the canvas off of the main thread.

Requires no transpilation and can be served directly. Entry point (to be set in index.html) is /js/script.js

## Rust version

Uses [Web Assembly](https://developer.mozilla.org/en-US/docs/WebAssembly) for computation, written in Rust. Also uses a [`Broadcast Channel`](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) for basic interop between JS worker and WASM thread. And imports the [web-sys](https://rustwasm.github.io/wasm-bindgen/api/web_sys/) crate to call canvas methods efficiently.

Needs to be compiled

```
wasm-pack build --target web
```

Entry point (to be set in index.html) is /js/wasm.js