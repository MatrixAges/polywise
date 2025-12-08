import type { ModalFuncProps, ModalProps } from 'antd'

interface Args {
	id?: string
	title: string
	content: string
	zIndex?: number
	width?: number | string
	danger?: boolean
	footer?: ModalProps['footer']
	props?: ModalFuncProps
}

export const confirm = async ({ id, title, content, zIndex, width, footer, danger, props }: Args) => {
	return new Promise(resolve => {
		$modal.confirm({
			className: danger ? 'danger' : '',
			title,
			content,
			centered: true,
			closable: true,
			zIndex,
			width: width ?? 360,
			footer,
			...props,
			getContainer: () => (id ? document.getElementById(id) : document.body)!,
			onOk() {
				resolve(true)
			},
			onCancel() {
				resolve(false)
			}
		})
	})
}

export const info = async ({ id, title, content, zIndex, width, footer, props }: Args) => {
	return new Promise(resolve => {
		$modal.info({
			title,
			content,
			centered: true,
			closable: true,
			zIndex,
			width: width ?? 360,
			footer,
			...props,
			getContainer: () => (id ? document.getElementById(id) : document.body)!,
			onOk() {
				resolve(true)
			}
		})
	})
}
