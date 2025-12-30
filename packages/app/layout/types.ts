import type { Settings } from '@/models'

export interface IPropsSidebar extends Pick<Settings, 'toggleSettings'> {}

export interface IPropsContent extends Pick<Settings, 'glass'> {}

export interface IPropsChat extends Pick<Settings, 'glass'> {}
