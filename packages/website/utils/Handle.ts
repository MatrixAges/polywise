type Element = JSX.Element | null

export default class Index<T> {
	private el: (props: T) => Element

	constructor(el: (props: T) => Element) {
		this.el = el
	}

	public by(fn: Function) {
		this.el = fn.call(this, this.el)

		return this
	}

	get() {
		return this.el
	}
}
