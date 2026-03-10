# hono+trpc如何挂载auth

使用 Hono 配合 tRPC 是一个极其优秀的组合！Hono 原生基于 Web Standards (Fetch API)，而 tRPC 也有官方的 Fetch 适配器，加上 `better-auth` 本身也是基于标准 Fetch Request 设计的，这三者结合可以达到**零性能损耗、代码极简**的效果。

在这种架构下，接口验证分为两个核心部分：

1. **暴露 Auth 端点**：让前端可以调用登录、注册等基础接口。
2. **保护 tRPC 路由**：在 tRPC 的上下文中解析验证信息，并用中间件拦截未授权的请求。

以下是具体的实现步骤和代码结构：

### 1. 在 Hono 中直接挂载 Better Auth

因为 Hono 的请求对象 `c.req.raw` 就是一个标准的 Web Request，所以我们可以彻底抛弃 `toNodeHandler`，直接调用 `better-auth` 的底层 handler。

**`src/index.ts` (Hono 入口)**

```typescript
import { Hono } from 'hono'

import { auth } from './auth' // 你上一讲配置好的 better-auth 实例

const app = new Hono()

// 1. 挂载 Better Auth 的核心端点 (/api/auth/*)
app.on(['POST', 'GET'], '/api/auth/**', c => {
	return auth.handler(c.req.raw)
})
```

---

### 2. 构建 tRPC 上下文 (Context)

tRPC 需要通过 Context 把“当前用户是谁”传递给后端的各个函数。我们在这里拦截请求，并利用 `better-auth` 解析 Session。

**`src/trpc/context.ts`**

```typescript
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

import { auth } from '../auth'

export const createContext = async (opts: FetchCreateContextFnOptions) => {
	// opts.req 是标准的 Web Request，可以直接拿来获取 header
	const session = await auth.api.getSession({
		headers: opts.req.headers
	})

	return {
		// 将 session 和 user 注入到 tRPC 上下文中
		session: session?.session ?? null,
		user: session?.user ?? null
	}
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

---

### 3. 定义 tRPC 中间件与路由 (Procedures)

有了 Context，我们就可以在 tRPC 中定义一个“受保护的通道 (Protected Procedure)”。任何使用这个通道的接口，如果不带有合法的会话，就会直接抛出 `UNAUTHORIZED` 错误。

**`src/trpc/router.ts`**

```typescript
import { initTRPC, TRPCError } from '@trpc/server'

import type { Context } from './context'

const t = initTRPC.context<Context>().create()

// 基础公开通道
export const publicProcedure = t.procedure

// 受保护通道（Auth 中间件拦截）
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session || !ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: '未授权：请先登录'
		})
	}

	// 类型收窄：接下来的路由中，ctx.user 和 ctx.session 绝对不为 null
	return next({
		ctx: {
			session: ctx.session,
			user: ctx.user
		}
	})
})

// 构建你的业务路由
export const appRouter = t.router({
	// 公开接口测试
	healthCheck: publicProcedure.query(() => {
		return { status: 'ok' }
	}),

	// 受保护接口测试
	getSecretData: protectedProcedure.query(({ ctx }) => {
		// 在这里直接使用 ctx.user，它是完全类型安全的！
		return {
			message: `欢迎回来，${ctx.user.name}！`,
			userId: ctx.user.id
		}
	})
})

export type AppRouter = typeof appRouter
```

---

### 4. 将 tRPC 挂载回 Hono

最后一步，使用 tRPC 的 fetch 适配器，把它作为一个路由挂载到你的 Hono 实例上。

**`src/index.ts` (补全)**

```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { createContext } from './trpc/context'
import { appRouter } from './trpc/router'

// ... 前面的 auth 挂载代码 ...

// 2. 挂载 tRPC 路由 (/trpc/*)
app.use('/trpc/*', async c => {
	return fetchRequestHandler({
		endpoint: '/trpc',
		req: c.req.raw, // Hono 的标准请求对象
		router: appRouter,
		createContext // 将我们上面写的上下文函数传进去
	})
})

export default {
	port: 3000,
	fetch: app.fetch
}
```

### 总结工作流

至此，你的后端完全打通了：

1. **登录验证**：前端发送 POST 请求到 `/api/auth/sign-in` (交由 Better Auth 处理，设置 Cookie/Session 存入 PGLite)。
2. **业务请求**：前端调用 tRPC 的 `getSecretData` 接口。
3. **拦截解析**：请求进入 Hono -> tRPC `createContext` -> Better Auth 校验 Cookie -> 生成上下文 -> `protectedProcedure` 拦截通过 -> 触发你的业务逻辑。
