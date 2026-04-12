import { strip_cd_pattern } from './constants'

export default (command: string) => {
	return command.replace(strip_cd_pattern, '')
}
