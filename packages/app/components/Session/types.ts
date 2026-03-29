import type Model from './model'

export interface IPropsInput extends Pick<Model, 'send' | 'stop' | 'clear'> {
	streaming: boolean
}
