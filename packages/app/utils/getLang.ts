import { locales } from '@/appdata'
import { match } from '@formatjs/intl-localematcher'

export default (lang: string) => match([lang], locales, locales[0])
