interface Env {
	ASSETS: {
		fetch(request: Request): Promise<Response>
	}
	BASE_URL: string
}

interface CloudflareEnv extends Env {}
