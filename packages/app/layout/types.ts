export interface IPropsTab {
	is_panel_collapsed?: boolean
	onExpand?: () => void
}

export interface IPropsPage {}

export interface IPropsPanel {
	onClose?: () => void
}
