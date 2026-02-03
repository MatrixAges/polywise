/**
 * Language Traps Dataset
 * Contains scenarios designed to trick simple keyword-based search or
 * naive semantic retrieval.
 */

export const homonymTraps = [
	{
		title: 'Mercury (Planet)',
		content: "Mercury is the smallest planet in the Solar System and the closest to the Sun. Its orbit around the Sun takes 87.97 Earth days, the shortest of all the Sun's planets."
	},
	{
		title: 'Mercury (Element)',
		content: 'Mercury is a chemical element with the symbol Hg and atomic number 80. It is commonly known as quicksilver and was formerly named hydrargyrum. It is the only metallic element that is liquid at standard conditions for temperature and pressure.'
	},
	{
		title: 'Mercury (Mythology)',
		content: 'Mercury is a major deity in Roman religion and mythology, being one of the 12 Dii Consentes within the ancient Roman pantheon. He is the god of financial gain, commerce, eloquence, messages, prophecy, boundaries, luck, trickery and thieves.'
	}
]

export const negationTraps = [
	{
		title: 'Database Compatibility Statement',
		content: 'It is a common misconception that Polywise supports MySQL directly. However, we must clarify that Polywise does NOT support MySQL or any other traditional relational database for its core memory storage. It uses a custom graph-based vector engine instead.'
	},
	{
		title: 'Integration Guide',
		content: 'While Polywise can be integrated with external tools, the core engine will never support legacy SQL dialects. Users looking for SQL support should look elsewhere.'
	}
]

export const temporalTraps = [
	{
		title: 'Polywise v0.1 Specification (DEPRECATED)',
		content: 'In version 0.1, the primary synchronization method is through manual polling of the memory state. This is the official way to keep nodes in sync.'
	},
	{
		title: 'Polywise v0.8 Specification (CURRENT)',
		content: 'As of version 0.8, manual polling has been replaced by a real-time reactive streaming architecture. Polling is no longer supported and will cause synchronization errors.'
	}
]

export const similarityTraps = [
	{
		title: "Polly-Wise: The Parrot Trainer's Manual",
		content: "The Polly-Wise method is the world's most effective way to teach your parrot to speak human languages. It focuses on repetition and positive reinforcement using high-frequency vocal patterns."
	},
	{
		title: 'Poly-Wise: A Guide to Wisdom in Polymathy',
		content: 'Being Poly-Wise means having the wisdom to connect different fields of study. This book explores the lives of great polymaths like Leonardo da Vinci.'
	}
]
