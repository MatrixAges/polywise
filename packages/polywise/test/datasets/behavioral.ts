export const behavioral_stimuli = [
	{
		stimulus: '火灾警报响了',
		label: 'Fire Alarm Triggered',
		action: '立刻疏散',
		action_desc: '按照紧急疏散路线，迅速撤离建筑物，不乘坐电梯。',
		metadata: {
			emergency_level: 'high',
			category: 'safety'
		}
	},
	{
		stimulus: '有人大声呼救',
		label: 'Cry for Help Heard',
		action: '确认位置并报警',
		action_desc: '寻找声音来源，拨打紧急电话 110/120 并告知具体位置。',
		metadata: {
			emergency_level: 'high',
			category: 'medical/security'
		}
	},
	{
		stimulus: '感觉非常口渴',
		label: 'Feeling Very Thirsty',
		action: '去喝水',
		action_desc: '寻找最近的水源，如饮水机或购买瓶装水。',
		metadata: {
			priority: 'medium',
			category: 'physiological'
		}
	},
	{
		stimulus: '电脑蓝屏死机',
		label: 'BSOD (Blue Screen of Death)',
		action: '尝试重启电脑',
		action_desc: '长按电源键强制关机后重新启动，检查是否有硬件连接问题。',
		metadata: {
			priority: 'low',
			category: 'technical'
		}
	}
]

export const behavioral_knowledge = [
	{
		title: '火灾应对进阶指南',
		content: '在火灾中，除了疏散，如果发现烟雾浓重，应弯腰低姿前行，并用湿毛巾捂住口鼻。如果门把手烫手，切勿开门。'
	},
	{
		title: '中暑与脱水的预防',
		content: '口渴是身体脱水的早期信号。在高热环境下，应定时饮用含有电解质的水，而不仅仅是纯净水。'
	}
]
