import { removeSync } from 'fs-extra'

removeSync(`${process.cwd()}/dist`)
removeSync(`${process.cwd()}/release`)
removeSync(`${process.cwd()}/zip`)
