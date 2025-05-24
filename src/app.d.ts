// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				// Add your Cloudflare environment bindings here if needed
				// Example: MY_KV: KVNamespace;
			};
			context?: {
				// Cloudflare Worker context
				waitUntil(promise: Promise<any>): void;
			};
			caches?: CacheStorage & { default: Cache };
		}
	}
}

export {};
