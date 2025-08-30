// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
			interface Locals {
		auth(): Promise<import('@auth/core/types').Session | null>;
	}

	interface PageData {
		form?: {
			action?: string;
			error?: boolean;
			message?: string;
			success?: boolean;
		};
	}
	}
}

export {};
