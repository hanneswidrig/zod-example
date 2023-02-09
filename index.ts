import Koa from "koa";
import cors from "@koa/cors";
import Router from "@koa/router";
import { z, ZodError } from "zod";

const rootRequestSchema = z.object({
	pageSize: z.string().transform((pageSize) => {
		const value = parseInt(pageSize, 10);
		return isNaN(value) ? 10 : value;
	}),
	flag: z
		.string()
		.optional()
		.transform((flag) => flag === "true"),
});

const app = new Koa();
const router = new Router();

app.use(router.routes()).use(router.allowedMethods()).use(cors());

router.use(async (ctx, next) => {
	await next();
	const rt = ctx.response.get("X-Response-Time");
	console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

router.use(async (ctx, next) => {
	const start = Date.now();
	await next();
	const ms = Date.now() - start;
	ctx.set("X-Response-Time", `${ms}ms`);
});

router.get("/", (ctx) => {
	try {
		const request = rootRequestSchema.parse(ctx.query);
		ctx.body = request;
	} catch (err) {
		if (err instanceof ZodError) {
			for (const { path, message } of err.errors) {
				console.error({ [path.join(".")]: message });
			}

			ctx.body = "Request failed in validation";
			ctx.status = 400;
		}
	}
});

app.listen(3963);
