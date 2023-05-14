import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import * as h from "./handlers.ts";
import { registerMiddleware } from "./middleware.ts";

const denoRegion = Deno.env.get("DENO_REGION");

const port = 8080;

const router = new Router();

router.get("/", h.frontend);
router.get("/embargo", h.checkEmbargoStatus);

const app = new Application();

registerMiddleware(app);

app.use(router.routes());
app.use(router.allowedMethods());

if (denoRegion) {
  console.log(`🚀 serving request from ${denoRegion}`);
} else {
  console.log(`🚀 serving request on localhost:${port}`);
}

await app.listen({ port });
