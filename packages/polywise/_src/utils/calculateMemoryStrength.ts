export default (context: { relevance_score?: number }) => (context.relevance_score ?? 1.0) * 0.5 + 0.5
