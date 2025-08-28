// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
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
		// interface PageState {}
		// interface Platform {}
	}
}

declare module 'pdf-parse' {
	interface PDFData {
		text: string;
		numpages: number;
		info: any;
		metadata: any;
		version: string;
	}

	function pdf(buffer: Buffer): Promise<PDFData>;
	export = pdf;
}

export {};
