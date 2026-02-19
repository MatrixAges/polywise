import 'dotenv/config'

import { app } from 'electron'

import conf from './conf'

if (!app.requestSingleInstanceLock()) app.exit()

conf.registerRendererListener()

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192')
app.commandLine.appendSwitch('lang', 'en-US')
