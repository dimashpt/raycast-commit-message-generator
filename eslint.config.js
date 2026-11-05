/* eslint-disable @typescript-eslint/no-require-imports */
const raycastConfig = require("@raycast/eslint-config");

module.exports = [
  ...(Array.isArray(raycastConfig) ? raycastConfig : [raycastConfig]),
  {
    ignores: ["raycast-env.d.ts", "dist/**"],
  },
];
