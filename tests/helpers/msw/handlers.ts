import { rest } from "msw";

export const handlers = [
  // Placeholder handler to keep Playwright and Vitest networks deterministic.
  rest.get("/__testing_health", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ status: "ok" }));
  }),
];
