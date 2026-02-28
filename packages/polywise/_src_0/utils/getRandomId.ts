import { randomBytes } from 'crypto'

export default () => randomBytes(6).toString('hex')
