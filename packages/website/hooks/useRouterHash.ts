'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default () => {
	const searchParams = useSearchParams()
	const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash.slice(1) : null)

	useEffect(() => {
		setHash(typeof window !== 'undefined' ? window.location.hash.slice(1) : null)
	}, [searchParams])

	return hash
}
