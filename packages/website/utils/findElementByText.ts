export default (el: HTMLElement, text: string, tag_name: string) => {
	const elements = el.getElementsByTagName(tag_name)
	const target = []

	for (let i = 0; i < elements.length; i++) {
		if ((elements[i] as HTMLElement).innerText.includes(text)) {
			target.push(elements[i])
		}
	}

	return target as Array<HTMLElement>
}
