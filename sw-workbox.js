// https://www.npmjs.com/package/workbox-sw
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');
const SW_VERSION = "0.0.93";
const logColors = "color: green; background: yellow;";
console.log(`%cThis is service worker SW_VERSION=${SW_VERSION}`, logColors);

workbox.precaching.precacheAndRoute([{"revision":"6613df4012e8510ec206571c6d91c462","url":"gamma.html"},{"revision":"b4e8828785204d0b1919ffe5d28fdc5d","url":"gz.svg"},{"revision":"39aa17174ff116b85cb76202e50305f0","url":"js/local-settings.js"},{"revision":"70c05e83e989d82732364d5465d6b896","url":"manifest.json"},{"revision":"8cef6700cbb498a214339b3ca291aecb","url":"pwa-not-cached.js"},{"revision":"ea061bd9991db03da2921e9bba426c7f","url":"pwa.js"},{"revision":"cf60c7f922ea3179da316172a8ef6325","url":"sw.js"},{"revision":"86e93264403127a11ae8c79e545ccfa3","url":"workbox-config.js"},{"revision":"00ec571bf8e55c81af6a8724b81a3310","url":"workbox-fd88d2de.js"}]);




self.addEventListener("message", errorHandlerAsyncEvent(async evt => {
    // FIX-ME: Do something when ping/keyChanged during login???
    // https://github.com/firebase/firebase-js-sdk/issues/1164
    if (evt.data?.eventType == "ping") return;
    if (evt.data?.eventType == "keyChanged") return;

    let msgType = "(NO TYPE)";
    if (evt.data) {
        msgType = evt.data.type;
    }
    console.log("%cservice-worker message", logColors, { evt, msgType });
    if (evt.data) {
        switch (msgType) {
            case 'GET_VERSION':
                console.log(`%cservice-worker GET_VERSION: ${SW_VERSION}`, logColors);
                // https://web.dev/two-way-communication-guide/
                evt.ports[0].postMessage(SW_VERSION);
                break;
            case 'SKIP_WAITING':
                // https://developer.chrome.com/docs/workbox/handling-service-worker-updates/
                self.skipWaiting();
                break;
            default:
                console.error("Unknown message data.type", { evt });
        }
    }
}));

function errorHandlerAsyncEvent(asyncFun) {
    // console.warn("typeof asyncFun", typeof asyncFun);
    return function (evt) {
        asyncFun(evt).catch(err => {
            console.log("handler", err);
            // debugger;
            throw err;
        })
    }
}
