import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

export default remark().use(remarkGfm).use(remarkMath)
