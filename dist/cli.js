#!/usr/bin/env node
import { startMenu } from "./menu.js";
startMenu().catch((err) => {
    console.error(err);
    process.exit(1);
});
