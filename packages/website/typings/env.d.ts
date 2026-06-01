interface Env {
	ASSETS: {
		fetch(request: Request): Promise<Response>
	}
	BASE_URL: string
	R2: R2Bucket
}

interface CloudflareEnv extends Env {}
