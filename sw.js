if (!self.define) {
    let e, s = {};
    const i = (i, t) => (i = new URL(i + ".js", t).href, s[i] || new Promise((s => {
        if ("document" in self) {
            const e = document.createElement("script");
            e.src = i, e.onload = s, document.head.appendChild(e)
        } else e = i, importScripts(i), s()
    })).then((() => {
        let e = s[i];
        if (!e) throw new Error(`Module ${i} didn’t register its module`);
        return e
    })));
    self.define = (t, r) => {
        const n = e || ("document" in self ? document.currentScript.src : "") || location.href;
        if (s[n]) return;
        let o = {};
        const d = e => i(e, n), c = {
            module: { uri: n },
            exports: o,
            require: d
        };
        s[n] = Promise.all(t.map((e => c[e] || d(e)))).then((e => (r(...e), o)))
    }
}
define(["./workbox-fd88d2de"], (function (e) {
    "use strict";
    self.addEventListener("message", (e => {
        e.data && "SKIP_WAITING" === e.data.type && self.skipWaiting()
    })),
        e.precacheAndRoute(
            [
                {
                    url: "gamma.html", revision: "4396cfb8d1c9c0192fad51cb81bdb858"
                },
                {
                    url: "gz.svg", revision: "b4e8828785204d0b1919ffe5d28fdc5d"
                },
                {
                    url: "js/local-settings.js", revision: "39aa17174ff116b85cb76202e50305f0"
                },
                {
                    url: "manifest.json", revision: "70c05e83e989d82732364d5465d6b896"
                }],
            {
                ignoreURLParametersMatching: [/^utm_/, /^fbclid$/]
            })
}));
//# sourceMappingURL=sw.js.map
// TEST from gh
