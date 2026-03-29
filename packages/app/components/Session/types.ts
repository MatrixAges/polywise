import type Model from './model'

export interface IPropsInput extends Pick<Model, 'clear' | 'send'> {
	streaming: boolean
}
