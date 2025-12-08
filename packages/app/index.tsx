import '@abraham/reflection'
import '@/presets'

import { createRoot } from 'react-dom/client'

import Layout from '@/layout'

createRoot(document.getElementById('root')!).render(<Layout></Layout>)
