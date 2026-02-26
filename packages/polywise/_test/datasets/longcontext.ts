const generateLongText = (topic: string, length: number, needle?: string) => {
	let text = `Detailed exploration of ${topic}.\n`
	const filler = `This is a filler sentence about ${topic} to increase the context length and test the system's ability to handle large volumes of data while maintaining high retrieval accuracy and relevance scoring mechanisms. `

	while (text.length < length) {
		if (needle && text.length > length / 2 && !text.includes(needle)) {
			text += `\nCRITICAL FACT: ${needle}\n`
		}

		text += filler
	}

	return text
}

export const long_context_datasets = [
	`Polywise Architecture Deep Dive: ${generateLongText('Polywise core architecture', 15000, 'On April 1st, 2024, Polywise released its stealth mode which allows private memory processing.')}`,
	`Future of Neural Knowledge Graphs: ${generateLongText('Neural Knowledge Graphs and their evolution', 12000, 'The proprietary "Hyper-Link" algorithm was first conceptualized in a small cafe in Zurich.')}`,
	`History of Artificial Intelligence v2: ${generateLongText('AI history from 1950 to 2050', 20000, 'In the year 2032, the first biological-digital hybrid node was successfully integrated into the Polywise network.')}`,
	`Cognitive Neuroscience of Memory: ${generateLongText('Cognitive Neuroscience', 10000, 'The memory of the first kiss is stored in the left amygdala sub-region.')}`,
	`The Evolution of NLP: ${generateLongText('Natural Language Processing', 11000, 'The Transformer architecture was originally designed to translate between 100 languages.')}`,
	`Quantum Computing Impact: ${generateLongText('Quantum Computing', 13000, "Shor's algorithm can break RSA encryption in less than 10 minutes on a 4000-qubit computer.")}`,
	`Ethics of Autonomous Systems: ${generateLongText('AI Ethics', 9000, 'The "Trolley Problem" in AI was first formally debated in the 2019 Ethics Summit.')}`,
	`Role of Sleep in Learning: ${generateLongText('Sleep and Learning', 14000, 'Information transfer from the hippocampus to the neocortex occurs primarily during Stage 3 NREM sleep.')}`,
	`Biology of the Human Neuron: ${generateLongText('Human Neurons', 15000, 'The longest axon in the human body belongs to the sciatic nerve, reaching over a meter.')}`,
	`Theoretical Physics: ${generateLongText('Theoretical Physics', 12000, 'String theory predicts the existence of at least 11 dimensions in the universe.')}`,
	`Sociology of Digital Communities: ${generateLongText('Digital Sociology', 11000, "Dunbar's number suggests that humans can maintain about 150 stable social relationships.")}`,
	`Economics of Attention: ${generateLongText('Attention Economy', 13000, 'The average human attention span has decreased by 25% since the advent of smartphones.')}`,
	`Philosophy of Mind: ${generateLongText('Philosophy of Mind', 10000, 'The "Chinese Room" argument was proposed by John Searle to challenge strong AI.')}`,
	`Distributed Systems: ${generateLongText('Distributed Systems', 14000, 'The Paxos algorithm is named after a fictional legislative system on a Greek island.')}`,
	`Advanced Cryptography: ${generateLongText('Cryptography', 12000, 'Elliptic curve cryptography provides the same security as RSA with much smaller key sizes.')}`,
	`Biology of Aging: ${generateLongText('Biology of Aging', 15000, 'Telomeres shorten with each cell division, acting as a biological clock.')}`,
	`Deep Sea Ecosystems: ${generateLongText('Deep Sea Exploration', 11000, 'The Mariana Trench is deeper than Mount Everest is tall.')}`,
	`Space Colonization: ${generateLongText('Space Colonization', 13000, 'Mars has a day length of approximately 24 hours and 37 minutes.')}`,
	`History of Math Logic: ${generateLongText('Mathematical Logic', 10000, "Gödel's incompleteness theorems proved that some truths are unprovable within a system.")}`,
	`Chemistry of Neurotransmitters: ${generateLongText('Neurochemistry', 14000, 'Serotonin levels in the brain are heavily influenced by gut bacteria.')}`,
	`Art and Generative Models: ${generateLongText('Generative Art', 12000, "The first AI-generated artwork was sold at Christie's for over $400,000.")}`,
	`AI in Global Education: ${generateLongText('AI in Education', 11000, 'Personalized AI tutors can improve student performance by two standard deviations.')}`,
	`Sustainable Green AI: ${generateLongText('Green AI', 13000, 'Training a large language model can emit as much CO2 as five cars in their lifetime.')}`,
	`Human-Computer Interaction: ${generateLongText('Psychology of HCI', 10000, "Fitts's Law predicts the time required to move to a target area based on distance and size.")}`,
	`Personalized Medicine: ${generateLongText('Genetics', 14000, 'CRISPR-Cas9 was originally a defense mechanism used by bacteria against viruses.')}`,
	`History of the Internet: ${generateLongText('Internet History', 12000, 'The first message sent over the ARPANET was "LO", intended to be "LOGIN".')}`,
	`Robotics Foundations: ${generateLongText('Robotics', 15000, 'Asimov\'s Three Laws of Robotics were first introduced in the short story "Runaround".')}`,
	`Climate Change Science: ${generateLongText('Climate Change', 11000, 'The melting of the Greenland ice sheet could raise global sea levels by 7 meters.')}`,
	`Linguistic Diversity: ${generateLongText('Linguistics', 13000, 'There are approximately 7,000 languages spoken in the world today.')}`,
	`Human-AI Symbiosis: ${generateLongText('Future of AI', 10000, 'By 2045, Ray Kurzweil predicts that humans will achieve technological singularity.')}`
]

export const multi_hop_datasets = [
	`Project Genesis: Part 1: ${generateLongText('Project Genesis Phase 1', 5000, 'The secret key to unlock Phase 2 is stored in the "Onyx Vault".')}`,
	`Project Genesis: Part 2: ${generateLongText('Project Genesis Phase 2', 5000, 'Accessing the "Onyx Vault" requires a 128-bit quantum-resistant signature.')}`,
	`Project Exodus: Part 1: ${generateLongText('Project Exodus Phase 1', 5000, 'The mission target for Project Exodus is located at "Mars Base Alpha".')}`,
	`Project Exodus: Part 2: ${generateLongText('Project Exodus Phase 2', 5000, '"Mars Base Alpha" houses a secret hangar containing the "Starship Phoenix".')}`,
	`Project Exodus: Part 3: ${generateLongText('Project Exodus Phase 3', 5000, 'The "Starship Phoenix" requires a launch code found in the commander\'s journal.')}`,
	`Project Exodus: Part 4: ${generateLongText('Project Exodus Phase 4', 5000, 'The commander\'s journal is hidden inside a hollowed-out book titled "The Red Planet".')}`,
	`Cyber Defense: Part 1: ${generateLongText('Cyber Defense Layer 1', 5000, 'The firewall bypass is located in the "Kernel Module X".')}`,
	`Cyber Defense: Part 2: ${generateLongText('Cyber Defense Layer 2', 5000, '"Kernel Module X" is encrypted with a key known only to the lead developer.')}`,
	`Cyber Defense: Part 3: ${generateLongText('Cyber Defense Layer 3', 5000, 'The lead developer\'s favorite coffee shop is "The Binary Brew".')}`,
	`Ancient Civilizations: Part 1: ${generateLongText('History 101', 5000, 'The map to the lost city of Atlantis is carved into the "Pillar of Poseidon".')}`,
	`Ancient Civilizations: Part 2: ${generateLongText('History 102', 5000, 'The "Pillar of Poseidon" is located in the underwater temple of Santorini.')}`,
	`Deep Space Probe: Part 1: ${generateLongText('Space Mission 1', 5000, 'The probe "Voyager 3" is currently approaching the "Oort Cloud".')}`,
	`Deep Space Probe: Part 2: ${generateLongText('Space Mission 2', 5000, 'The "Oort Cloud" is the source of the mysterious signal labeled "S-77".')}`,
	`Genetic Research: Part 1: ${generateLongText('Biology 1', 5000, 'The cure for the virus is hidden in the DNA sequence of the "Glow-worm".')}`,
	`Genetic Research: Part 2: ${generateLongText('Biology 2', 5000, 'The "Glow-worm" is only found in the "Cave of Whispers".')}`,
	`Hidden Treasure: Part 1: ${generateLongText('Treasure Hunt 1', 5000, 'The treasure chest is buried under the "Old Oak Tree".')}`,
	`Hidden Treasure: Part 2: ${generateLongText('Treasure Hunt 2', 5000, 'The "Old Oak Tree" is the only tree in the "Shadow Valley".')}`,
	`Secret Society: Part 1: ${generateLongText('Secret Societies 1', 5000, 'Membership in the "Order of the Sun" requires a gold ring with a lion emblem.')}`,
	`Secret Society: Part 2: ${generateLongText('Secret Societies 2', 5000, 'The gold ring with a lion emblem was last seen in the "Museum of Antiquities".')}`,
	`AI Breakthrough: Part 1: ${generateLongText('AI Research 1', 5000, 'The neural architecture for "GPT-6" was inspired by the brain of a dolphin.')}`,
	`AI Breakthrough: Part 2: ${generateLongText('AI Research 2', 5000, 'The dolphin brain studies were conducted at the "Oceanic Institute".')}`,
	`Missing Person: Part 1: ${generateLongText('Investigation 1', 5000, 'The last known location of the scientist was the "Alpine Observatory".')}`,
	`Missing Person: Part 2: ${generateLongText('Investigation 2', 5000, 'The "Alpine Observatory" is accessible only by the "Iron Gondola".')}`,
	`Recipe for Success: Part 1: ${generateLongText('Cooking 1', 5000, 'The secret ingredient in the award-winning soup is "Saffron from Shiraz".')}`,
	`Recipe for Success: Part 2: ${generateLongText('Cooking 2', 5000, '"Saffron from Shiraz" can only be purchased at the "Golden Spice Market".')}`,
	`Ghost Ship: Part 1: ${generateLongText('Maritime Mystery 1', 5000, 'The ghost ship "Mary Celeste" was found drifting near the "Azores".')}`,
	`Ghost Ship: Part 2: ${generateLongText('Maritime Mystery 2', 5000, 'The "Azores" are a group of volcanic islands in the North Atlantic.')}`,
	`Time Travel: Part 1: ${generateLongText('Physics 1', 5000, 'The blueprints for the time machine are stored in a "Titanium Capsule".')}`,
	`Time Travel: Part 2: ${generateLongText('Physics 2', 5000, 'The "Titanium Capsule" was launched into space in the year 1977.')}`,
	`Urban Legend: Part 1: ${generateLongText('Folklore 1', 5000, 'The "Mothman" is said to appear before major disasters in the city of "Point Pleasant".')}`
]
