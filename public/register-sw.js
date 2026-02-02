"use strict";

const stockSW = "./sw.js";

/**
 * List of hostnames that are allowed to run serviceworkers on http://
 */
const swAllowedHostnames = ["localhost", "127.0.0.1"];

/**
 * Register the Scramjet service worker
 */
async function registerSW() {
    if (!navigator.serviceWorker) {
        if (
            location.protocol !== "https:" &&
            !swAllowedHostnames.includes(location.hostname)
        )
            throw new Error("Service workers cannot be registered without https.");
        throw new Error("Your browser doesn't support service workers.");
    }

    // Register the service worker
    await navigator.serviceWorker.register(stockSW, {
        scope: "/"
    });

    console.log("✅ Service worker registered successfully");
}
