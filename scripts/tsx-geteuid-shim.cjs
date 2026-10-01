"use strict";

if (typeof process.geteuid !== "function") {
  process.geteuid = () => process.env.USERNAME || process.env.USER || "user";
}
