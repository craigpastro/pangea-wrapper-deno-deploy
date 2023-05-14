import { Application, isHttpError } from "https://deno.land/x/oak/mod.ts";

const responseTimeHeader = "X-Response-Time";

// The first middleware is the outer most.
export function registerMiddleware(app: Application) {
  // request and response logger
  app.use(async (ctx, next) => {
    await next();

    const msg = {
      req: {
        url: ctx.request.url.href,
        method: ctx.request.method,
        ip: ctx.request.ip,
      },
      resp: { status: ctx.response.status },
      rt: ctx.response.headers.get(responseTimeHeader),
    };
    console.log(msg);
  });

  // request timing
  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const rt = Date.now() - start;

    console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}ms`);
    ctx.response.headers.set(responseTimeHeader, `${rt}ms`);
  });

  // error handler
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      console.log(err);

      if (isHttpError(err)) {
        ctx.response.status = err.status;
      } else {
        ctx.response.status = 500;
      }

      ctx.response.body = JSON.stringify({ error: err.message });
    }
  });
}
