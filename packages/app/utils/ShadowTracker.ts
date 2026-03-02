export default class Index extends HTMLElement {
	public cleanup = null as (() => void) | null

	disconnectedCallback() {
		this.cleanup?.()
	}
}
