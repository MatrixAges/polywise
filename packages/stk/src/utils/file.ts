export const convertFile = (file: Blob, type?: 'base64' | 'array_buffer') => {
	const { promise, resolve, reject } = Promise.withResolvers<string>()

	const reader = new FileReader()

	reader.onload = () => {
		resolve(reader.result as string)
	}

	reader.onerror = () => {
		reject(reader.error)
	}

	if (type) {
		switch (type) {
			case 'base64':
				reader.readAsDataURL(file)
				break
			case 'array_buffer':
				reader.readAsArrayBuffer(file)
				break
		}
	} else {
		reader.readAsText(file)
	}

	return promise
}

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

export const downloadImage = (filename: string, data_url: string, ext: string) => {
	const link = document.createElement('a')

	link.style.display = 'none'
	link.href = data_url
	link.download = `${filename}.${ext}`

	document.body.appendChild(link)

	link.click()

	document.body.removeChild(link)
}

export const uploadFile = (args?: { max_count?: number; accept?: string }) => {
	const { max_count, accept } = args || {}
	const input = document.createElement('input') as HTMLInputElement

	input.style.display = 'none'
	input.type = 'file'
	input.multiple = max_count! > 1

	if (accept) input.accept = accept

	const { promise, resolve } = Promise.withResolvers<Array<File> | false>()

	const onChange = (e: Event) => {
		let files = Array.from((e.target as HTMLInputElement).files!)

		if (max_count && files.length > max_count) {
			files = files.slice(0, max_count)
		}

		input.removeEventListener('change', onChange)
		input.remove()

		resolve(files)
	}

	input.addEventListener('change', onChange)

	input.addEventListener('cancel', () => {
		input.removeEventListener('change', onChange)
		input.remove()

		resolve(false)
	})

	document.body.appendChild(input)

	input.click()

	return promise
}
