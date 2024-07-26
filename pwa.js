const version = "1.3.0";

/*
    This is a boilerplate for handling a simple PWA.
    The current version of this file should always be available at

        https://github.com/lborgman/hour/blob/main/pwa.js

    This pwa handler consists of 3 parts:
    
        1) This file, pwa.js which can be cached.
        2) pwa-not-cached.js which is not cached. 
        3) sw-input.js - which I use myself here.

    The web browser client should just do

      import("pwa.js");

    This in turn imports "pwa-not-cached.js".
    Any changes to your PWA handling should be done to this later file
    which is not cached.


    The user will be automatically prompted to update.
    The styling of that dialog is done by adding a style sheet
    before all other style sheets. So you can easily override this.


    *** THE SERVICE WORKER FILE ***

    You can handle it whichever way you want.
    (I prefer to use Google Workbox, loaded from the internet.
    This works together with pwa-not-cached.js which also
    loads Workbord from the internet.)

    The only important thing is that it answers a request for version:

        self.addEventListener("message", async evt => {
            let msgType;
            if (evt.data) { msgType = evt.data.type; }
            if (evt.data) {
                switch (msgType) {
                    case 'GET_VERSION':
                        evt.ports[0].postMessage(SW_VERSION);
                        break;
                }
            }
        });

    I handle it the way below.
    When I want to create a the service worker file then I:
    
        1) Change the SW_VERSION at the top of sw-input.js
        2) run "nxp workbox-cli injectManifest"

    In the call to workbox-cli above the file workbox-config.js is used.
    I have just created this with

        npx workbox-cli wizard

    My code have been tested with Google Chrome web browser
    using GitHub Pages as the server.


    I plan to use these files in different small projects.
    If I need to change anything I will first try it out in
    the (toy) project "Get hour number":

        https://github.com/lborgman/hour
*/


const versions = {
    "pwa.js": version,
    "pwa-not-cached.js": "not available"
}

export function getVersions() {
    return versions;
}

const logStyle = "background:yellowgreen; color:black; padding:2px; border-radius:2px;";
const logStrongStyle = logStyle + " font-size:18px;";
logStrongConsole("Here is pwa.js, ver 3", import.meta.url);

function logConsole(...msg) { console.log(`%cpwa.js`, logStyle, ...msg); }
function logStrongConsole(...msg) { console.log(`%cpwa.js`, logStrongStyle, ...msg); }

const idDebugSection = "pwa-debug-output";
const secDebug = document.getElementById(idDebugSection);
const keyLogToScreen = `${import.meta.url}-default-log-to-screen`;
let mayLogToScreen = localStorage.getItem(keyLogToScreen) != null;
if (mayLogToScreen && secDebug) { secDebug.style.display = "unset"; }

function addScreenDebugRow(...txt) {
    if (!mayLogToScreen) return;
    if (secDebug == undefined) return;
    if (secDebug.parentElement == null) return;
    if (secDebug.textContent.trim() == "") {
        const btnClose = mkElt("button", undefined, "Close debug output");
        btnClose.addEventListener("click", evt => secDebug.remove());
        const rowClose = mkElt("div", undefined, btnClose);
        secDebug.appendChild(rowClose);
    }
    // logConsole(`checkPWA DEBUG: ${txt}`);
    logConsole(`SCREEN DEBUG`, [...txt].slice(1));
    // const pRow = mkElt("p", undefined, txt);
    const pRow = mkElt("p", undefined, [...txt]);
    secDebug.appendChild(pRow);
}




const urlPWA = new URL(import.meta.url);
const params = [...urlPWA.searchParams.keys()];
if (params.length > 0) console.error("pwa.js should have no parameters");
if (urlPWA.hash.length > 0) console.error("pwa.js should have no hash");


let modNotCached;

let theFunVersion;
let theEltVersion;
let updateTitle;

const secDlgUpdateTransition = 1;
const msDlgUpdateTransition = 1000 * secDlgUpdateTransition;

let secPleaseWaitUpdating = 2000;
let msPleaseWaitUpdating = 1000 * secPleaseWaitUpdating;

addCSS();

class WaitUntil {
    #evtName; #target; #prom;
    constructor(evtName, target) {
        this.#evtName = evtName;
        this.#target = target || window;
        this.#prom = simpleBlockUntilEvent(this.#target, this.#evtName);
    }
    promReady() { return this.#prom; }
    tellReady() { this.#target.dispatchEvent(new Event(this.#evtName)); }
}

const waitUntilNotCachedLoaded = new WaitUntil("pwa-loaded-not-cached");
async function loadNotCached() {
    // FIX-ME: What happens when !navigator.onLine ?
    let isOnLine = PWAonline();
    if (isOnLine) {
        urlPWA.pathname = urlPWA.pathname.replace("pwa.js", "pwa-not-cached.js");
        const ncVal = new Date().toISOString().slice(0, -5);
        urlPWA.searchParams.set("nocache", ncVal);
        let href = urlPWA.href;

        // Browsers return TypeError when module is not found. Strange, but...
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
        //   If moduleName refers to a module that doesn't exist, rejects with TypeError (all browsers).
        let errCls;
        const errMsgs = [];
        try {
            modNotCached = await import(href);
        } catch (err) {
            errCls = err.constructor.name
            errMsgs.push(mkElt("b", undefined, errCls));
            const errMsg = err.message;
            errMsgs.push(errMsg);
            logStrongConsole(errMsg, errCls);
            console.trace(err);
            console.error(err);
        }
        if (!modNotCached) {
            function startDlgErr(title) {
                const dlgErr = document.createElement("dialog");
                dlgErr.id = "dialog-err-pwa";
                dlgErr.appendChild(mkElt("h2", undefined, title));
                return dlgErr;
            }
            const dlgErr = startDlgErr("Error loading pwa-not-cached.js");

            let isFetchError = false;
            if (errCls == "TypeError") {
                const f = await fetch(href);
                console.log(f);
                if (!f.ok) {
                    isFetchError = true;
                    errMsgs.push(`http status: ${f.status}`);
                    errMsgs.push(mkElt("a", { href, target: "_blank" }, href));
                }
            }
            if (!isFetchError) {
                errMsgs.push("----");
                errMsgs.push("(More info in console)");
            }
            errMsgs.forEach(m => {
                dlgErr.appendChild(mkElt("div", undefined, m));
            });
            dlgErr.appendChild

            function finishAndShowDlgErr() {
                const btnClose = document.createElement("button");
                btnClose.textContent = "Close";
                btnClose.addEventListener("click", evt => { dlgErr.remove(); })
                const pClose = document.createElement("p");
                pClose.appendChild(btnClose);
                dlgErr.appendChild(pClose);

                document.body.appendChild(dlgErr);
                dlgErr.showModal();
            }
            finishAndShowDlgErr();
            waitUntilNotCachedLoaded.tellReady();
            return;
        }
    } else {
        logStrongConsole("offline, can't load pwa-not-cached.js");
    }
    waitUntilNotCachedLoaded.tellReady();

    if (modNotCached?.getSecPleaseWaitUpdating) {
        secPleaseWaitUpdating = modNotCached.getSecPleaseWaitUpdating();
        msPleaseWaitUpdating = 1000 * secPleaseWaitUpdating;
    }

    versions["pwa-not-cached.js"] = modNotCached.getVersion();
    const myFuns = {
        "mkElt": mkElt,
        "promptForUpdate": promptForUpdate,
        "addScreenDebugRow": addScreenDebugRow,
        "getDisplayMode": getDisplayMode,
    }
    modNotCached.setPWAfuns(myFuns);
    addCSS();
    logStrongConsole("loadNotCached", { modNotCached });
}


if (PWAonline()) {
    loadNotCached();
} else {
    window.addEventListener("online", evt => { loadNotCached(); }, { once: true });
}

const keyVersion = `PWA-version ${import.meta.url}`;
function saveAppVersion(version) { localStorage.setItem(keyVersion, version); }
function getSavedAppVersion() { return localStorage.getItem(keyVersion); }

const waitUntilSetVerFun = new WaitUntil("pwa-set-version-fun");
export async function setVersionSWfun(funVersion) {
    theFunVersion = funVersion;
    const swController = navigator.serviceWorker.controller;
    if (PWAonline()) {
        const funVerSet = (version) => {
            if (/^\d+\.\d+\.\d+$/.test(version)) {
                saveAppVersion(version);
            }
            if (theFunVersion) {
                const oldEltVersion = theEltVersion;
                theEltVersion = theFunVersion(version);
                if (theEltVersion) {
                    if (!oldEltVersion) {
                        theEltVersion.title = "Click to show more about version";
                        theEltVersion.addEventListener("click", evt => {
                            evt.stopPropagation();
                            const aPwsJs = mkElt("a", { href: import.meta.url, target: "_blank" }, "pwa.js");

                            const dlg = mkElt("dialog", { id: "pwa-dialog-versions" }, [
                                mkElt("h2", undefined, "PWA info and debug"),
                                mkElt("p", undefined, [
                                    mkElt("i", undefined, [
                                        "This info is for developer debugging.",
                                        " How to set up this is described in the beginning of the file ",
                                    ]),
                                    aPwsJs,
                                ]),
                            ]);
                            dlg.appendChild(mkElt("div", undefined, `App version: ${getSavedAppVersion()}`));

                            dlg.appendChild(mkElt("div", undefined, "Service Worker:"));
                            const appendIndentedRow = (txt) => {
                                const row = mkElt("div", undefined, txt);
                                row.style.marginLeft = "10px";
                                dlg.appendChild(row);
                            }
                            if (swController == null) {
                                appendIndentedRow("null");
                            } else {
                                const u = swController.scriptURL;
                                const aSW = mkElt("a", { href: u, target: "_blank" }, u);
                                appendIndentedRow(mkElt("div", undefined, [
                                    "scriptURL: ",
                                    aSW
                                ]));
                                appendIndentedRow(mkElt("div", undefined, [
                                    "state: ",
                                    swController.state
                                ]));
                            }

                            for (const k in versions) {
                                const v = versions[k];
                                dlg.appendChild(mkElt("div", undefined, `${k}: ${v}`));
                            }

                            const chkLogToScreen = mkElt("input", { type: "checkbox" });
                            chkLogToScreen.checked = mayLogToScreen;
                            chkLogToScreen.addEventListener("input", evt => {
                                mayLogToScreen = !mayLogToScreen;
                                if (mayLogToScreen) {
                                    localStorage.setItem(keyLogToScreen, "may log to screen");
                                } else {
                                    localStorage.removeItem(keyLogToScreen);
                                }
                                if (secDebug) {
                                    if (mayLogToScreen) {
                                        secDebug.style.display = "unset";
                                    } else {
                                        secDebug.style.display = "none";
                                    }
                                }
                            });
                            dlg.appendChild(
                                mkElt("p", undefined, [
                                    mkElt("span", undefined, [
                                        mkElt("b", undefined, "Log to screen at start: "),
                                        chkLogToScreen
                                    ])
                                ]));


                            const btnClose = mkElt("button", undefined, "Close");
                            const divClose = mkElt("p", undefined, btnClose);
                            dlg.appendChild(divClose);
                            document.body.appendChild(dlg);
                            btnClose.addEventListener("click", evt => {
                                dlg.close();
                                dlg.remove();
                            });
                            dlg.showModal();
                            setTimeout(() => btnClose.focus(), 100);
                        });
                    }
                }
            }
        }
        // funVerSet("Wait...");
        // console.trace("after Wait...");
        funVerSet("");
        // await waitUntilNotCachedLoaded.promReady();
        // modNotCached?.setVersionSWfun(funVerSet);
    } else {
        const storedVersion = getSavedAppVersion();
        if (funVersion) { funVersion(storedVersion); }
    }
    const messageChannelVersion = new MessageChannel();
    messageChannelVersion.port1.onmessage = (event) => { theFunVersion(event.data); };
    // navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" }, [messageChannelVersion.port2]);
    swController.postMessage({ type: "GET_VERSION" }, [messageChannelVersion.port2]);
    waitUntilSetVerFun.tellReady();
}
export async function setUpdateTitle(strTitle) { updateTitle = strTitle; }
export async function startSW(urlSW) {
    if (!PWAonline()) { return; }
    await waitUntilNotCachedLoaded.promReady();
    modNotCached?.startSW(urlSW);
}



// https://dev.to/somedood/promises-and-events-some-pitfalls-and-workarounds-elp
function simpleBlockUntilEvent(targ, evtName) {
    return new Promise(resolve => targ.addEventListener(evtName, resolve, { passive: true, once: true }));
}

function addCSS() {
    const idCSS = "css-pwa.js";
    const eltOld = document.getElementById(idCSS);
    if (eltOld) {
        return;
    }
    const eltCSS = document.createElement("style");
    eltCSS.id = idCSS;
    eltCSS.textContent =
        `
        dialog {
            max-width: 300px;
            border-radius: 4px;
            font-size: 16px;
            padding: 20px;
            box-shadow: black 8px 8px 8px;
        }

        dialog::backdrop {
            background-color: black;
            opacity: 0.5;
        }

        dialog a {
            color: darkblue;
        }

        dialog button {
            font-size: 1rem;
        }

        dialog>h2 {
            font-size: 20px;
            font-style: italic;
        }



        dialog#pwa-dialog-versions {
            background: wheat;
            background: linear-gradient(240deg, #00819c 0%, #545b98 100%);
            color: black;
        }



        dialog#pwa-dialog-update {
            background: linear-gradient(200deg, #4b6cb7 0%, #182848 100%);
            background: linear-gradient(240deg, #00819c 0%, #3a47d5 100%);
            background: linear-gradient(240deg, #00819c 0%, #2b35a3 100%);
            font-size: 18px;
            color: white;
            border: 2px solid white;
            opacity: 1;
            transition: opacity ${secDlgUpdateTransition}s;
        }

        dialog#pwa-dialog-update>p:last-child {
            display: flex;
            gap: 10px;
        }

        dialog#pwa-dialog-update::backdrop {
            /* not inherited by default */
            transition: inherit;
        }

        dialog#pwa-dialog-update.transparent {
            opacity: 0;
        }

        dialog#pwa-dialog-update.transparent::backdrop {
            opacity: 0;
        }

        dialog#pwa-dialog-update.updating {
            box-shadow: 3px 5px 5px 12px rgba(255,255,127,0.75);
        }


        dialog#dialog-err-pwa {
            background-color: darkred;
            color: yellow;
            max-width: 90vw;
        }



        #pwa-debug-output {
            position: fixed;
            top: 0;
            left: 0;
            font-size: 14px;
            background-color: wheat;
            color: black;
            padding: 8px;
            box-shadow: aquamarine 8px 8px 8px;
        }

        #pwa-debug-output>p {
            margin-block-start: 0.5em;
            margin-block-end: 0.5em;
        }


    `;
    const style1 = document.querySelector("style");
    document.head.insertBefore(eltCSS, style1);
}




function mkElt(type, attrib, inner) {
    const elt = document.createElement(type);

    function addInner(inr) {
        if (inr instanceof Element) {
            elt.appendChild(inr);
        } else {
            const txt = document.createTextNode(inr.toString());
            elt.appendChild(txt);
        }
    }
    if (inner) {
        if (inner.length && typeof inner != "string") {
            for (let i = 0; i < inner.length; i++)
                if (inner[i])
                    addInner(inner[i]);
        } else
            addInner(inner);
    }
    for (const x in attrib) {
        elt.setAttribute(x, attrib[x]);
    }
    return elt;
}

async function promptForUpdate(waitingVersion) {
    const btnSkip = mkElt("button", undefined, "Skip");
    const btnUpdate = mkElt("button", undefined, "Update");
    const divPromptButtons = mkElt("p", undefined, [btnUpdate, btnSkip]);
    const dlgPromptUpdate = mkElt("dialog", { id: "pwa-dialog-update", class: "pwa2-dialog" }, [
        mkElt("h2", undefined, updateTitle),
        mkElt("p", undefined, [
            "Update available:",
            mkElt("div", undefined, `version ${waitingVersion}`)
        ]),
        divPromptButtons
    ]);
    document.body.appendChild(dlgPromptUpdate);
    dlgPromptUpdate.showModal();

    return new Promise((resolve, reject) => {
        btnSkip.addEventListener("click", evt => {
            resolve(false);
            dlgPromptUpdate.classList.add("transparent");
            setTimeout(() => { dlgPromptUpdate.remove(); }, msDlgUpdateTransition);
        });
        btnUpdate.addEventListener("click", evt => {
            dlgPromptUpdate.textContent = "Updating, please wait ...";
            dlgPromptUpdate.classList.add("updating");
            window.onbeforeunload = null;
            resolve(true);
            theFunVersion("Updating");
            setTimeout(() => {
                dlgPromptUpdate.classList.add("transparent");
            }, msPleaseWaitUpdating);
        });
    });
}



// https://dev.to/maxmonteil/is-your-app-online-here-s-how-to-reliably-know-in-just-10-lines-of-js-guide-3in7
// Saving this, looks useful...
export async function PWAonline() {
    if (!window.navigator.onLine) return false

    // avoid CORS errors with a request to your own origin
    const url = new URL(window.location.origin)

    // random value to prevent cached responses
    function getRandomString() { return Math.random().toString(36).substring(2, 15) }
    url.searchParams.set('rand', getRandomString())
    let urlHref = url.href;
    console.log("try to fetch", urlHref);

    try {
        const response = await fetch(urlHref, { method: 'HEAD' },)
        // console.trace("got response", response);
        // Any response is ok here
        return true;
    } catch {
        console.log("didn't get response");
        return false
    }
}

export function getDisplayMode() {
    let displayMode = 'browser';
    const mqStandAlone = '(display-mode: standalone)';
    if (navigator.standalone || window.matchMedia(mqStandAlone).matches) {
        displayMode = 'standalone';
    }
    return displayMode;
}