"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const parser = new DOMParser();
    const HOME = window.HOME_URL || document.querySelector('meta[name="home-url"]')?.content || location.origin;
    // Handler: noscript to img/svg
    (() => {
        document.querySelectorAll("noscript[icon]").forEach(async (noscript) => {
            const container = noscript.parentElement;
            if (!container)
                return;
            const doc = parser.parseFromString(noscript.innerHTML, "text/html");
            const img = doc.querySelector("img");
            const src = img?.getAttribute("src");
            if (!src || !src.endsWith(".svg"))
                return;
            try {
                const res = await fetch(src);
                if (!res.ok)
                    throw new Error(`Failed to load ${src}`);
                const svg = parser.parseFromString(await res.text(), "image/svg+xml").documentElement;
                svg.setAttribute("aria-hidden", "true");
                svg.setAttribute("focusable", "false");
                container.appendChild(svg);
                noscript.remove();
            }
            catch (err) {
                console.error("SVG fetch error:", err);
            }
        });
    })();
    // Handler: typography of #Enter
    (() => {
        const typography = document.querySelector("#Enter p.typography");
        if (typography) {
            const typerAttr = typography.getAttribute("typer");
            if (!typerAttr)
                throw new Error("No 'typer' attribute found.");
            const active = () => document.visibilityState === "visible" && location.hash === "#Enter";
            const words = typerAttr.split(",").map((w) => w.trim());
            typography.innerHTML = words.map(w => `<span>${[...w].map(l => `<i>${l === " " ? "&nbsp;" : l}</i>`).join("")}</span>`).join(" ");
            const spans = [...typography.querySelectorAll("span")];
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            let cur = 0;
            [...spans[cur].querySelectorAll("i")].forEach(i => i.classList.add("on"));
            spans[cur].classList.add("on");
            (async function loop() {
                for (;;) {
                    if (!active()) {
                        await new Promise(r => setTimeout(r, 2000));
                        continue;
                    }
                    const next = (cur + 1) % spans.length;
                    const curIs = [...spans[cur].querySelectorAll("i")];
                    const nextIs = [...spans[next].querySelectorAll("i")];
                    spans[cur].classList.remove("on");
                    spans[next].classList.add("on");
                    nextIs.forEach(i => i.classList.remove("on"));
                    const steps = Math.max(curIs.length, nextIs.length);
                    await sleep(4000);
                    for (let k = 0; k < steps; k++) {
                        if (k < curIs.length)
                            curIs[k].classList.remove("on");
                        if (k < nextIs.length)
                            nextIs[k].classList.add("on");
                        await sleep(100);
                    }
                    cur = next;
                }
            })();
        }
    })();
    // Handler: Animation Behind of #Self cards
    (() => {
        const SEL = "#Self > div > div > div > section:nth-child(2) > ul > li";
        const SPEED = 40, SPAWN = 1, SMIN = 2, SMAX = 12, IDLE = "#fff6", ACTIVE = "#fff6", MAX_IDLE = 20, DECAY_K = 1, MIN_V = 10, layers = [];
        const seedIdle = (L) => {
            const count = Math.floor(Math.random() * (MAX_IDLE + 1));
            for (let i = 0; i < count; i++) {
                const s = SMIN + Math.random() * (SMAX - SMIN);
                L.stars.push({ x: Math.random() * L.w, y: Math.random() * L.h, v: 0, s });
            }
        };
        document.querySelectorAll(SEL).forEach(li => {
            li.style.position ||= "relative";
            const c = document.createElement("canvas"), g = c.getContext("2d");
            Object.assign(c.style, { position: "absolute", inset: "0", pointerEvents: "none", zIndex: "0" });
            li.prepend(c);
            const L = { li, c, g, w: 1, h: 1, dpr: 1, stars: [], carry: 0, hover: false, dirty: true };
            const fit = () => {
                const r = li.getBoundingClientRect();
                L.w = Math.max(1, r.width);
                L.h = Math.max(1, r.height);
                L.dpr = Math.max(1, devicePixelRatio || 1);
                c.width = Math.round(L.w * L.dpr);
                c.height = Math.round(L.h * L.dpr);
                c.style.width = L.w + "px";
                c.style.height = L.h + "px";
                g.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
                L.stars = [];
                seedIdle(L);
                L.dirty = true;
            };
            fit();
            new ResizeObserver(fit).observe(li);
            li.addEventListener("mouseenter", () => {
                L.hover = true;
                L.dirty = true;
                for (const s of L.stars)
                    if (s.v === 0)
                        s.v = SPEED * (0.6 + Math.random() * 0.8);
            });
            li.addEventListener("mouseleave", () => {
                L.hover = false;
                L.dirty = true;
            });
            layers.push(L);
        });
        // rAF
        let last = performance.now();
        const tabOn = () => document.visibilityState === "visible";
        function loop(t) {
            const dt = Math.min(0.05, (t - last) / 1000);
            last = t;
            if (tabOn()) {
                for (const L of layers) {
                    const g = L.g;
                    if (L.hover) {
                        let exp = SPAWN * dt + L.carry, n = exp | 0;
                        L.carry = exp - n;
                        if (Math.random() < L.carry) {
                            n++;
                            L.carry = 0;
                        }
                        while (n--) {
                            const s = SMIN + Math.random() * (SMAX - SMIN);
                            L.stars.push({
                                x: -s,
                                y: Math.random() * L.h,
                                v: SPEED * (0.6 + Math.random() * 0.8),
                                s
                            });
                        }
                        for (let i = L.stars.length - 1; i >= 0; i--) {
                            const s = L.stars[i];
                            s.x += s.v * dt;
                            if (s.x - s.s > L.w)
                                L.stars.splice(i, 1);
                        }
                        g.clearRect(0, 0, L.w, L.h);
                        g.fillStyle = ACTIVE;
                        for (const s of L.stars) {
                            g.font = `${s.s}px system-ui,Segoe UI,Roboto,sans-serif`;
                            g.fillText("✦", s.x, s.y);
                        }
                    }
                    else {
                        let moving = false;
                        for (const s of L.stars) {
                            if (s.v > 0) {
                                s.v *= Math.exp(-DECAY_K * dt);
                                if (s.v < MIN_V)
                                    s.v = 0;
                                else {
                                    s.x += s.v * dt;
                                    moving = true;
                                }
                            }
                        }
                        if (moving) {
                            g.clearRect(0, 0, L.w, L.h);
                            g.fillStyle = ACTIVE;
                            for (const s of L.stars) {
                                g.font = `${s.s}px system-ui,Segoe UI,Roboto,sans-serif`;
                                g.fillText("✦", s.x, s.y);
                            }
                        }
                        else {
                            if (L.dirty) {
                                g.clearRect(0, 0, L.w, L.h);
                                g.fillStyle = IDLE;
                                for (const s of L.stars) {
                                    g.font = `${s.s}px system-ui,Segoe UI,Roboto,sans-serif`;
                                    g.fillText("✦", s.x, s.y);
                                }
                                L.dirty = false;
                            }
                        }
                    }
                }
            }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    })();
    // Handler: Form
    (() => {
        const KEY = "coda_sayhi_submits";
        const form = document.querySelector("#sayhi_form");
        const toObj = (fd) => {
            const o = {};
            fd.forEach((v, k) => o[k] = v instanceof File ? { name: v.name, size: v.size, type: v.type } : String(v));
            return o;
        };
        const save = (entry) => {
            const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
            list.push(entry);
            if (list.length > 100)
                list.shift();
            localStorage.setItem(KEY, JSON.stringify(list));
        };
        form?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const fd = new FormData(form);
            const base = {
                ts: new Date().toISOString(),
                data: toObj(fd),
                url: form.action,
                method: form.method
            };
            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: fd,
                    headers: {
                        Accept: "application/json",
                    },
                    signal: AbortSignal.timeout(4000)
                });
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    const msg = data?.errors?.map((e) => e.message).join(", ") || "Oops! There was a problem submitting your form";
                    save({ ...base, status: "error", code: response.status, msg });
                    alertify("error", msg);
                }
                else {
                    save({ ...base, status: "success" });
                    alertify("success", "Thanks for your submission!");
                    form.reset();
                }
            }
            catch (error) {
                save({ ...base, status: "network_error", msg: error?.message || "Network error" });
                alertify("error", "Oops! There was a problem submitting your form");
            }
        });
    })();
    // Handler: Play Song
    (() => {
        const btn = document.querySelector("#music");
        if (!btn)
            return;
        const src = new URL("assets/audio/Miriam.mp3", HOME).toString();
        let audio = null, playing = false;
        btn.addEventListener("click", async () => {
            audio ??= Object.assign(new Audio(src), {
                preload: "auto"
            });
            try {
                playing ? (audio.pause(), playing = false, console.clear()) : (await audio.play(), playing = true, audio.volume = 0.3, consoleImage(new URL("assets/img/0x1.gif", HOME).toString()));
                btn.classList.toggle("is_playing", playing);
            }
            catch (error) {
                alertify("warning", "Oops! something wrong to play music: " + error?.message);
            }
        });
    })();
    // Handler: Auto close menu
    (() => {
        const menu = document.querySelector("body > header > nav:nth-child(3)");
        const btn = document.querySelector("#Menu");
        if (!btn || !menu)
            return;
        const close = () => {
            btn.checked = false;
            btn.dispatchEvent(new Event('change', { bubbles: true }));
        };
        addEventListener("pointerdown", e => {
            const t = e.target;
            if (btn.checked && !(menu.contains(t) || t === btn || t.closest?.("#Menu")))
                close();
        }, true);
        addEventListener("keydown", e => e.key === "Escape" && btn.checked && close());
    })();
    // Global Function: alerts
    function alertify(type, msg, time = 4000) {
        // 0x0a5 0x15d 0xb71 0x911
        const root = document.getElementById("alert") ?? (() => {
            const el = document.createElement("div");
            el.id = "alert";
            document.body.appendChild(el);
            return el;
        })();
        const el = document.createElement("div");
        el.className = `toast ${type}`;
        const icon = document.createElement("span");
        icon.className = "icon";
        icon.innerHTML =
            type === "success" ? '<svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' :
                type === "info" ? '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2"/><path d="M12 8h.01M11 12h2v5h-2z" fill="#fff"/></svg>' :
                    type === "warning" ? '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l9 16H3L12 3z" stroke="#fff" stroke-width="2"/><path d="M12 9v5" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="#fff"/></svg>' :
                        '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2"/><path d="M15 9l-6 6m0-6l6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
        const text = document.createElement("div");
        text.className = "msg";
        text.textContent = msg;
        el.appendChild(icon);
        el.appendChild(text);
        root.appendChild(el);
        requestAnimationFrame(() => el.classList.add("show"));
        let closed = false;
        const remove = () => {
            if (closed)
                return;
            closed = true;
            el.classList.remove("show");
            const done = () => el.remove();
            el.addEventListener("transitionend", done, { once: true });
            setTimeout(done, 350);
        };
        let timer = window.setTimeout(remove, time);
        el.addEventListener("mouseenter", () => clearTimeout(timer));
        el.addEventListener("mouseleave", () => { if (!closed)
            timer = window.setTimeout(remove, 1200); });
        el.addEventListener("click", remove);
    }
    // Global Function: Play video in console
    function consoleImage(url) {
        const fileReader = new FileReader();
        fileReader.addEventListener("load", () => {
            const style = [
                `font-size:178px`,
                `background:url("${fileReader.result}") left top no-repeat`,
                `background-size:contain;`,
                `color:transparent`,
            ].join(';');
            console.log('%c     ', style);
        });
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
            if (blob.type.indexOf("image") === 0) {
                if (blob.size > 8192 && navigator.userAgent.indexOf("Firefox") > 0) {
                    throw new Error("Image size too big to be displayed in Firefox.");
                }
                return blob;
            }
            throw new Error("Valid image not found.");
        })
            .then(blob => fileReader.readAsDataURL(blob))
            .catch(error => console.warn(error.message));
    }
});
