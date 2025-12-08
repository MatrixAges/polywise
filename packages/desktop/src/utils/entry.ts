import 'dotenv/config'
import './initSettings'

import { app } from 'electron'

import conf from './conf'

if (!app.requestSingleInstanceLock()) app.exit()

conf.registerRendererListener()

app.commandLine.appendSwitch('lang', 'en-US')
