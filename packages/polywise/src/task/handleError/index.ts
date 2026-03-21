import handleTripleError from './handleTripleError'

const error_handlers: Record<string, (args: any) => Promise<void>> = {
	triple: handleTripleError
}

export default error_handlers
