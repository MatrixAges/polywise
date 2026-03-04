import custom from './__custom__'
import aliyun_bailian from './aliyun_bailian'
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
import mistral from './mistral'
import ollama from './ollama'
import openai from './openai'
import openrouter from './openrouter'
import perplexity from './perplexity'
import siliconflow from './siliconflow'
import tencent_hunyuan from './tencent_hunyuan'
import together from './together'
import vercel from './vercel'
import volcengine from './volcengine'
import xai from './xai'
import zhipu from './zhipu'

export const preset_providers = [openai, anthropic, google_gemini, xai, deepseek, groq, ollama]

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
	siliconflow,
	together,
	vercel,
	zhipu,
	aliyun_bailian,
	tencent_hunyuan,
	volcengine,
	azure_openai,
	amazon_bedrock
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
	siliconflow,
	together,
	vercel,
	zhipu,
	aliyun_bailian,
	tencent_hunyuan,
	volcengine,
	azure_openai,
	amazon_bedrock,
	custom
}
