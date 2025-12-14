var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/backend/middleware/auth.ts
async function authenticate(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader && request.url.includes("localhost")) {
  }
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Response("Unauthorized: Missing or invalid Authorization header", { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
  if (!googleRes.ok) {
    throw new Response("Unauthorized: Invalid Google Token", { status: 401 });
  }
  const payload = await googleRes.json();
  const userId = payload.sub;
  const email = payload.email;
  const name = payload.name;
  const picture = payload.picture;
  try {
    await env.DB.prepare(
      `INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name=excluded.name, picture=excluded.picture`
    ).bind(userId, email, name, picture).run();
  } catch (e) {
    console.error("Failed to sync user to D1", e);
  }
  return { userId, email, name, picture };
}
__name(authenticate, "authenticate");

// src/backend/do/NoteStore.ts
import { DurableObject } from "cloudflare:workers";
var NoteStore = class extends DurableObject {
  static {
    __name(this, "NoteStore");
  }
  state;
  constructor(state, env) {
    super(state, env);
    this.state = state;
  }
  // Decay Logic: Alive -> Warming -> Cooling
  calculateStatus(note) {
    if (note.status === "archived") return "archived";
    const now = Date.now();
    const age = now - note.updatedAt;
    if (age < 3600 * 1e3) return "alive";
    if (age < 24 * 3600 * 1e3) return "warming";
    return "cooling";
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/notes") {
      const space = url.searchParams.get("space") || "main";
      const notesMap = await this.state.storage.list();
      let notes = Array.from(notesMap.values());
      notes = notes.filter((n) => (n.space || "main") === space).map((n) => ({ ...n, status: this.calculateStatus(n) }));
      notes.sort((a, b) => b.createdAt - a.createdAt);
      return new Response(JSON.stringify({ notes }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (request.method === "POST" && url.pathname === "/api/notes") {
      const body = await request.json();
      const now = Date.now();
      const newNote = {
        id: crypto.randomUUID(),
        userId: body.userId,
        content: body.content,
        intent: body.intent || "thinking",
        status: "alive",
        createdAt: now,
        updatedAt: now,
        space: body.space || "main"
      };
      await this.state.storage.put(newNote.id, newNote);
      return new Response(JSON.stringify(newNote), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (request.method === "PATCH" && url.pathname.match(/\/api\/notes\/.*\/archive/)) {
      const id = url.pathname.split("/")[3];
      const note = await this.state.storage.get(id);
      if (note) {
        const body = await request.json();
        note.status = "archived";
        note.closedAt = Date.now();
        note.updatedAt = Date.now();
        if (body.summary) note.summary = body.summary;
        await this.state.storage.put(id, note);
        return new Response(JSON.stringify(note), { headers: { "Content-Type": "application/json" } });
      }
      return new Response("Note not found", { status: 404 });
    }
    if (request.method === "PATCH" && url.pathname.match(/\/api\/notes\/[^\/]+$/)) {
      const id = url.pathname.split("/").pop();
      if (id) {
        const note = await this.state.storage.get(id);
        if (note) {
          const body = await request.json();
          note.content = body.content;
          note.updatedAt = Date.now();
          note.status = "alive";
          await this.state.storage.put(id, note);
          return new Response(JSON.stringify(note), { headers: { "Content-Type": "application/json" } });
        }
      }
    }
    return new Response("Method Not Allowed", { status: 405 });
  }
};

// src/backend/index.ts
var backend_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) {
      const user = await authenticate(request, env);
      const id = env.NOTES_DO.idFromName(user.userId);
      const stub = env.NOTES_DO.get(id);
      if (request.method === "POST") {
        const body = await request.json();
        const newBody = { ...body, userId: user.userId };
        return stub.fetch(new Request(request.url, {
          method: "POST",
          headers: request.headers,
          body: JSON.stringify(newBody)
        }));
      }
      return stub.fetch(request);
    }
    return new Response("Not Found", { status: 404 });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-eFJZqG/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = backend_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-eFJZqG/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  NoteStore,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
