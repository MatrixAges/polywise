import { removeSync } from 'fs-extra'

import { productName, version } from '../package.json'

const target_path = `${process.cwd()}/release/win32/x64`

removeSync(`${target_path}/win-unpacked`)
removeSync(`${target_path}/${productName}-${version}-setup.exe.blockmap`)
