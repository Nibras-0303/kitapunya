import serverBundle from "../dist/server.cjs";

// Support both ES Module default export and direct CommonJS export
const app = serverBundle.default || serverBundle;

export default app;
