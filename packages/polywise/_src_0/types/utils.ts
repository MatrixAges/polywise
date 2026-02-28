export interface KeywordScore {
	word: string
	score: number
}

export interface TaggedWord {
	word: string
	tag: string
}

export interface ExtractorOptions {
	pooling: 'mean'
	normalize: boolean
}

export interface ExtractorOutput {
	tolist: () => Array<Array<number>>
}

export type Extractor = (input_list: Array<string>, options: ExtractorOptions) => Promise<ExtractorOutput>
