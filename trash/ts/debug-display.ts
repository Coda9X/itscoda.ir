// Debug Mode
    (() => {
        type DebugOverlayOptions = {
            refreshMs?: number;
            position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
            startOpen?: boolean;
        };

        // برای استفاده فوری بدون export:
        const mountDebugOverlay = (opts: DebugOverlayOptions = {}) => {
            const refreshMs = opts.refreshMs ?? 800;
            const startOpen = opts.startOpen ?? true;

            const root = document.createElement("div");
            root.id = "debug-overlay";
            root.style.cssText = `
      position: fixed; z-index: 2147483647;
      top: 120px; right: 120px;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      color: #e7e7e7; background: rgba(10,10,10,.82);
      border: 1px solid rgba(255,255,255,.12); border-radius: 10px;
      box-shadow: 0 8px 30px rgba(0,0,0,.35);
      min-width: 260px; max-width: 420px; backdrop-filter: blur(6px);
      user-select: none; -webkit-user-select: none;
    `;

            const header = document.createElement("div");
            header.style.cssText = `
      display:flex; align-items:center; gap:8px; padding:8px 10px; cursor:move;
      border-bottom: 1px solid rgba(255,255,255,.08);
      background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,0));
    `;
            header.innerHTML = `
      <strong style="font-weight:700; letter-spacing:.2px;">Debug Overlay</strong>
      <span id="dbg-fps" style="margin-left:auto; font-weight:700;">-- FPS</span>
      <button id="dbg-toggle" title="Collapse" style="
        margin-left:8px; background:#2b2b2b; color:#fff; border:1px solid rgba(255,255,255,.15);
        border-radius:6px; padding:4px 8px; cursor:pointer;">–</button>
    `;

            const body = document.createElement("div");
            body.id = "dbg-body";
            body.style.cssText = `padding:8px 10px 10px 10px; max-height: 60vh; overflow:auto;`;

            const pre = document.createElement("pre");
            pre.id = "dbg-pre";
            pre.style.cssText = `white-space:pre-wrap; margin:0;`;
            body.appendChild(pre);

            root.append(header, body);
            document.body.appendChild(root);

            const setCorner = (pos: DebugOverlayOptions["position"]) => {
                root.style.top = ""; root.style.right = ""; root.style.bottom = ""; root.style.left = "";
                switch (pos) {
                    case "top-left": root.style.top = "120px"; root.style.left = "120px"; break;
                    case "bottom-right": root.style.bottom = "120px"; root.style.right = "120px"; break;
                    case "bottom-left": root.style.bottom = "120px"; root.style.left = "120px"; break;
                    default: root.style.top = "120px"; root.style.right = "12px"; break;
                }
            };
            setCorner(opts.position);

            // Drag
            (() => {
                let dragging = false, sx = 0, sy = 0, startTop = 0, startLeft = 0;
                header.addEventListener("mousedown", (e) => {
                    if ((e.target as HTMLElement).id === "dbg-toggle") return;
                    dragging = true;
                    sx = e.clientX; sy = e.clientY;
                    const rect = root.getBoundingClientRect();
                    root.style.top = `${rect.top}px`;
                    root.style.left = `${rect.left}px`;
                    root.style.right = ""; root.style.bottom = "";
                    startTop = rect.top; startLeft = rect.left;
                    const onMove = (ev: MouseEvent) => {
                        if (!dragging) return;
                        root.style.top = `${startTop + (ev.clientY - sy)}px`;
                        root.style.left = `${startLeft + (ev.clientX - sx)}px`;
                    };
                    const onUp = () => {
                        dragging = false;
                        document.removeEventListener("mousemove", onMove);
                    };
                    document.addEventListener("mousemove", onMove);
                    document.addEventListener("mouseup", onUp, { once: true });
                    e.preventDefault();
                });
            })();

            // Collapse/Expand
            let collapsed = !(opts.startOpen ?? true);
            const toggleBtn = header.querySelector<HTMLButtonElement>("#dbg-toggle")!;
            const setCollapsed = (state: boolean) => {
                collapsed = state;
                body.style.display = collapsed ? "none" : "block";
                toggleBtn.textContent = collapsed ? "+" : "–";
            };
            setCollapsed(collapsed);
            toggleBtn.onclick = () => setCollapsed(!collapsed);

            // Shortcut
            const onKey = (e: KeyboardEvent) => {
                if (e.ctrlKey && e.key === "`") setCollapsed(!collapsed);
            };
            window.addEventListener("keydown", onKey);

            // FPS
            const fpsEl = header.querySelector<HTMLSpanElement>("#dbg-fps")!;
            let last = performance.now(), frames = 0, fps = 0, fpsAcc = 0, fpsSamples = 0;
            let rafId = 0;
            const loop = (t: number) => {
                frames++;
                const dt = t - last;
                if (dt >= 500) {
                    const instFps = Math.round((frames * 1000) / dt);
                    fps = instFps;
                    fpsAcc += instFps; fpsSamples++;
                    fpsEl.textContent = `${instFps} FPS`;
                    frames = 0; last = t;
                }
                rafId = requestAnimationFrame(loop);
            };
            rafId = requestAnimationFrame(loop);

            // GPU
            const getGPUInfo = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
                    if (!gl) return { renderer: "N/A", vendor: "N/A" };
                    const dbgInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
                    const vendor = dbgInfo ? (gl as any).getParameter(dbgInfo.UNMASKED_VENDOR_WEBGL) : "Hidden";
                    const renderer = dbgInfo ? (gl as any).getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL) : "Hidden";
                    return { renderer, vendor };
                } catch {
                    return { renderer: "N/A", vendor: "N/A" };
                }
            };

            // Memory
            const getMemory = () => {
                const anyPerf = performance as any;
                const mem = anyPerf && anyPerf.memory ? anyPerf.memory : null;
                if (!mem) return "N/A";
                const mb = (n: number) => (n / (1024 * 1024)).toFixed(1) + " MB";
                return `JS Heap: ${mb(mem.usedJSHeapSize)} / ${mb(mem.totalJSHeapSize)} (limit ~${mb(mem.jsHeapSizeLimit)})`;
            };

            // Network
            const getNetwork = () => {
                const nav: any = navigator;
                const c = nav.connection || nav.mozConnection || nav.webkitConnection;
                if (!c) return "N/A";
                const parts: string[] = [];
                if (c.effectiveType) parts.push(`type=${c.effectiveType}`);
                if (c.downlink) parts.push(`down=${c.downlink}Mb/s`);
                if (typeof c.rtt === "number") parts.push(`rtt=${c.rtt}ms`);
                if (c.saveData) parts.push("saveData=on");
                return parts.join(", ");
            };

            const getOrientation = () => {
                const o = (screen.orientation && screen.orientation.type) || (window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape");
                return String(o);
            };

            const gpu = getGPUInfo();

            const format = () => {
                const dpr = window.devicePixelRatio || 1;
                const scr = `${screen.width}×${screen.height} @${dpr}x`;
                const vw = `${window.innerWidth}×${window.innerHeight}`;
                const avail = `${screen.availWidth}×${screen.availHeight}`;
                const color = `${screen.colorDepth}-bit`;
                const lang = `${navigator.language} (${[...navigator.languages || []].join(", ")})`;
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "N/A";
                const mem = getMemory();
                const net = getNetwork();
                const cores = (navigator as any).hardwareConcurrency ?? "N/A";
                const ua = navigator.userAgent;
                const plat = (navigator as any).userAgentData?.platform || navigator.platform || "N/A";
                const onLine = navigator.onLine ? "online" : "offline";
                const orientation = getOrientation();
                const now = new Date();
                const time = `${now.toLocaleString()} (${tz})`;

                return [
                    `Time        : ${time}`,
                    `Viewport    : ${vw}`,
                    `Screen      : ${scr} | avail ${avail} | color ${color}`,
                    `Orientation : ${orientation}`,
                    `DPR         : ${dpr}`,
                    `Memory      : ${mem}`,
                    `CPU Cores   : ${cores}`,
                    `GPU         : ${gpu.vendor} — ${gpu.renderer}`,
                    `Network     : ${net}`,
                    `Online      : ${onLine}`,
                    `Lang        : ${lang}`,
                    `Platform    : ${plat}`,
                    `UA          : ${ua}`,
                    ``,
                    `Tips: Ctrl+\` برای مخفی/نمایش • Drag با نوار بالا • ممکن است برخی داده‌ها محدود باشند.`,
                ].join("\n");
            };

            // const pre = body.querySelector<HTMLPreElement>("#dbg-pre")!;
            pre.textContent = format();

            const interval = window.setInterval(() => { pre.textContent = format(); }, refreshMs);

            // رویدادها
            const onResize = () => (pre.textContent = format());
            const onConnChange = () => (pre.textContent = format());
            const onVisibility = () => (pre.textContent = format());
            window.addEventListener("resize", onResize);
            window.addEventListener("orientationchange", onResize);
            document.addEventListener("visibilitychange", onVisibility);
            const navAny: any = navigator;
            const conn = navAny.connection || navAny.mozConnection || navAny.webkitConnection;
            if (conn) conn.addEventListener?.("change", onConnChange);

            // موقعیت اولیه
            if (opts.position) setCorner(opts.position);

            const unmount = () => {
                cancelAnimationFrame(rafId);
                clearInterval(interval);
                window.removeEventListener("resize", onResize);
                window.removeEventListener("orientationchange", onResize);
                window.removeEventListener("keydown", onKey);
                document.removeEventListener("visibilitychange", onVisibility);
                if (conn) conn.removeEventListener?.("change", onConnChange);
                root.remove();
            };

            const getAverageFPS = () => (fpsSamples ? Math.round(fpsAcc / fpsSamples) : fps);

            return {
                root,
                collapse: () => setCollapsed(true),
                expand: () => setCollapsed(false),
                toggle: () => setCollapsed(!collapsed),
                get fps() { return fps; },
                get averageFps() { return getAverageFPS(); },
                unmount,
            };
        };

        // به محض لود صفحه، خودکار mount شود (دلخواه: تنظیمات را اینجا تغییر دهید)
        const instance = mountDebugOverlay({ position: "top-right", refreshMs: 800, startOpen: true });
        // برای دسترسی در کنسول/بیرون:
        (window as any).__dbg = instance;
    })();