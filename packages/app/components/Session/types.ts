import type { Chat } from '@/utils'
import type Model from './model'

export interface IPropsInput extends Pick<Model, 'clear'> {
	streaming: boolean
	submit: Chat['sendMessage']
}
