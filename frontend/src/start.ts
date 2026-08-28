import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try { return await next(); } catch (error) { console.error(error); throw error; }
});
const csrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });
export const startInstance = createStart(() => ({ requestMiddleware: [errorMiddleware, csrfMiddleware] }));
