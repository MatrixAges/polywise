import amazon_bedrock from './amazon_bedrock'
import anthropic from './anthropic'
import azure_openai from './azure_openai'
import cerebras from './cerebras'
import cohere from './cohere'
import deepinfra from './deepinfra'
import deepseek from './deepseek'
import fireworks from './fireworks'
import google_gemini from './google_gemini'
import groq from './groq'
import lmstudio from './lmstudio'
import minimax from './minimax'
import mistral from './mistral'
import moonshot from './moonshot'
import ollama from './ollama'
import openai from './openai'
import custom from './openai_compatible'
import openrouter from './openrouter'
import perplexity from './perplexity'
import together from './together'
import vercel from './vercel'
import xai from './xai'
import zhipu from './zhipu'

export const preset_providers = [openai, anthropic, google_gemini, zhipu, minimax, moonshot, deepseek]

export const all_providers = [
	openai,
	anthropic,
	google_gemini,
	xai,
	deepseek,
	openrouter,
	ollama,
	cerebras,
	cohere,
	deepinfra,
	fireworks,
	groq,
	lmstudio,
	mistral,
	perplexity,
	together,
	vercel,
	zhipu,
	azure_openai,
	amazon_bedrock,
	minimax,
	moonshot
]

export {
	openai,
	anthropic,
	google_gemini,
	xai,
	deepseek,
	openrouter,
	ollama,
	cerebras,
	cohere,
	deepinfra,
	fireworks,
	groq,
	lmstudio,
	mistral,
	perplexity,
	together,
	vercel,
	zhipu,
	azure_openai,
	amazon_bedrock,
	minimax,
	moonshot,
	custom
}
