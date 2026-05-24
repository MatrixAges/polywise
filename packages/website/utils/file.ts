export const downloadFile = (filename: string, text: string, ext: string, mime_type?: string) => {
	const blob = new Blob([text], { type: mime_type ?? 'text/plain;charset=utf-8' })
	const url = URL.createObjectURL(blob)

	const link = document.createElement('a')

	link.style.display = 'none'
	link.href = url
	link.download = `${filename}.${ext}`

	document.body.appendChild(link)

	link.click()

	document.body.removeChild(link)

	URL.revokeObjectURL(url)
}

export const downloadFileBySrc = (src: string) => {
	const link = document.createElement('a')
	const url = `/${src}`

	link.style.display = 'none'
	link.href = url
	link.download = src

	document.body.appendChild(link)

	link.click()

	document.body.removeChild(link)

	URL.revokeObjectURL(url)
}
