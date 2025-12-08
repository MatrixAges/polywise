import { debounce } from 'es-toolkit/compat'
import { makeAutoObservable } from 'mobx'

import { useInstanceWatch } from '@/mobx'

import type { Watch } from '@/mobx'
import type { IReactionDisposer, Lambda } from 'mobx'

const addEventListeners = (object: typeof window | typeof document, events: Array<string>, callback: () => any) => {
	events.forEach(event => {
		object.addEventListener(event, debounce(callback, 900, { leading: true }))
	})
}

const removeEventListeners = (object: typeof window | typeof document, events: Array<string>, callback: () => any) => {
	events.forEach(event => {
		object.removeEventListener(event, debounce(callback, 900, { leading: true }))
	})
}

type MaybePromise<T> = T | Promise<T>

interface Config<T = {}> {
	context?: T
	events?: string[]
	onIdle?: () => MaybePromise<any>
	onActive?: () => MaybePromise<any>
	onHide?: () => MaybePromise<any>
	onShow?: () => MaybePromise<any>
}

export default class Index<T = {}> {
	config = {
		context: null,
		events: ['mousemove', 'scroll', 'keydown', 'mousedown', 'touchstart'],
		onIdle: null,
		onActive: null,
		onHide: null,
		onShow: null
	} as Config<T>

	time = 60000
	idle = false
	visible = true
	timer = null
	acts = [] as Array<IReactionDisposer | Lambda>

	watch = {
		time: v => {
			this.off()

			if (v) this.on()
		}
	} as Watch<Index>

	constructor() {
		makeAutoObservable(this, { config: false, timer: false, acts: false }, { autoBind: true })

		this.acts = [...useInstanceWatch(this)]
	}

	init(time: number, config: Config<T>) {
		if (!time) return

		this.time = time
		this.config = Object.assign(this.config, config)

		this.on()
	}

	on() {
		this.start()

		addEventListeners(window, this.config.events, this.active.bind(this.config.context ?? this))

		if (this.config.onShow || this.config.onHide) {
			addEventListeners(
				document,
				['visibilitychange'],
				this.changeVisible.bind(this.config.context ?? this)
			)
		}
	}

	off() {
		if (this.timer) clearTimeout(this.timer)

		this.acts.map(item => item())

		removeEventListeners(window, this.config.events, this.active.bind(this.config.context ?? this))

		if (this.config.onShow || this.config.onHide) {
			removeEventListeners(
				document,
				['visibilitychange'],
				this.changeVisible.bind(this.config.context ?? this)
			)
		}
	}

	private start() {
		if (this.timer) clearTimeout(this.timer)

		this.timer = setTimeout(() => {
			this.idle = true
			this.config.onIdle && this.config.onIdle.call(this.config.context ?? this)
		}, this.time)
	}

	private active() {
		if (this.idle) {
			this.idle = false

			this.config.onActive && this.config.onActive.call(this.config.context ?? this)
		}

		this.start()
	}

	private changeVisible() {
		if (document.hidden) {
			if (this.visible) {
				this.visible = false
				this.config.onHide && this.config.onHide.call(this.config.context ?? this)
			}
		} else {
			if (!this.visible) {
				this.visible = true
				this.config.onShow && this.config.onShow.call(this.config.context ?? this)
			}
		}
	}
}
