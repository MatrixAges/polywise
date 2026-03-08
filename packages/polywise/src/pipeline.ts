import { join } from 'path'
import { ModelDownloader } from 'node-llama-cpp'
import { injectable } from 'tsyringe'

import { app } from './consts'

@injectable()
export default class Index {}
