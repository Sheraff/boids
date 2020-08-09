const channel = new BroadcastChannel('wasm interop')
export function sendMessage(...args) {
    channel.postMessage({args})
}