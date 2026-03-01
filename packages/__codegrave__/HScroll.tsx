;<ScrollMenu
	wrapperClassName={$cx(
		'scroll_wrap overflow-hidden pr-2',
		is_mac_electron && 'is_mac_electron',
		panel_collapsed && 'panel_collapsed',
		is_win_electron && column_is_last && 'column_is_last'
	)}
	scrollContainerClassName='items-center gap-1.5'
	onWheel={onWheel}
>
	{content_tabs.map((item, index) => {
		return <TabItem {...item} active={active_index === index} key={item.type + item.title}></TabItem>
	})}
</ScrollMenu>
