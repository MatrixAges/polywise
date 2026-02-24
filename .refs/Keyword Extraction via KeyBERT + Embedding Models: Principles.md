## Keyword Extraction via KeyBERT + Embedding Models: Principles and Papers

KeyBERT is an **unsupervised** keyword extraction technique based on Embedding Models, released by Maarten Grootendorst in 2020.

1. Core Principle: Semantic Similarity Matching

The core logic behind KeyBERT is quite intuitive: **words or phrases that are semantically most similar to the document as a whole best represent the document's topic.** The execution steps are as follows:

1.    **Document Embedding**: Use a pre-trained model (such as BERT or [Sentence-BERT](https://maartengr.github.io/KeyBERT/guides/embeddings.html)) to encode the entire document into a high-dimensional vector.
2.    **Candidate Extraction**: Use tools like `CountVectorizer` to extract candidate keywords from the document (usually N-gram phrases).
3.    **Candidate Embedding**: Use the same pre-trained model to encode each candidate word into a vector.
4.    **Cosine Similarity Calculation**: Calculate the [cosine similarity](https://www.maartengrootendorst.com/blog/keybert/) between the document vector and each candidate word vector.
5.    **Ranking and Output**: Sort by similarity scores from high to low, and extract the top N as keywords.

6.    Key Optimization Techniques

To address the issue where extraction results might be too monolithic, KeyBERT introduces diversification algorithms:

- **Max Sum Similarity**: Looks for a combination within the candidate set where candidates have the lowest similarity to each other but the highest similarity to the document.
- **Maximal Marginal Relevance (MMR)**: Reduces redundancy by penalizing words similar to those already selected, while ensuring relevance.

3. Related Papers and Citations

KeyBERT is primarily released as an open-source project, and the author provides the following citation information:

- **Official Citation**: Grootendorst, M. (2020). KeyBERT: Minimal keyword extraction with BERT. Zenodo.
- **Technical Cornerstone**: Its core relies on the **Sentence-BERT** paper: Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks.
- **Application Research**: Some academic papers have demonstrated through experiments that KeyBERT outperforms traditional statistical methods like TF-IDF and TextRank in terms of accuracy.

4. Recommended Embedding Models

According to the [KeyBERT official documentation](https://github.com/MaartenGr/KeyBERT), it is recommended to choose models based on language:

- **English**: `all-MiniLM-L6-v2` (lightweight and efficient).
- **Multilingual (including Chinese)**: `paraphrase-multilingual-MiniLM-L12-v2`.
- **General**: Supports any [Transformer model](https://developer.aliyun.com/article/1628905) on Hugging Face or Flair embeddings.

Are you looking to apply KeyBERT in a **specific domain** (such as healthcare or finance), or do you want to further optimize extraction results by **combining it with LLMs** (like KeyLLM)?
