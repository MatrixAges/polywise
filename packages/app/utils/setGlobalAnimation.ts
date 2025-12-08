export default () => {
	const css = document.createElement('style')

	css.appendChild(document.createTextNode(`*{transition:all ease 0.15s !important}`))

	document.head.appendChild(css)

	setTimeout(() => document.head.removeChild(css), 150)
}
