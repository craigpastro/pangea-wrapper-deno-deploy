import { Application } from "https://deno.land/x/oak/mod.ts";

const responseTimeHeader = "X-Response-Time";

export function registerMiddleware(app: Application) {
  app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.headers.get(responseTimeHeader);
    console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
  });

  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.response.headers.set(responseTimeHeader, `${ms}ms`);
  });
}
