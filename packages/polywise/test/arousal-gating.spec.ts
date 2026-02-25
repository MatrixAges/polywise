import { describe, expect, it } from '@rstest/core'

import { calculateArousal } from '../src/Polywise'

describe.concurrent('Arousal gating curve', () => {
	it('should favor moderate similarity over low similarity', () => {
		const low_arousal = calculateArousal(0.05)
		const mid_arousal = calculateArousal(0.6)

		expect(mid_arousal).toBeGreaterThan(low_arousal)
	})

	it('should reduce arousal when similarity is too high', () => {
		const mid_arousal = calculateArousal(0.6)
		const high_arousal = calculateArousal(0.95)

		expect(mid_arousal).toBeGreaterThan(high_arousal)
	})
})
