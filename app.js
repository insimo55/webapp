const tg = window.Telegram?.WebApp;
if (tg) {
    try {
        tg.expand();
        tg.setHeaderColor(tg.themeParams.secondary_bg_color || "#ffffff");
    } catch(e) {}
}

const App = (() => {
    const pageCache = new Map();
    const containerId = "app";
    const pagesPath = "pages/";

    async function loadPage(path) {
        if (pageCache.has(path)) return pageCache.get(path);
        const res = await fetch(path);
        if (!res.ok) throw new Error("404");
        const html = await res.text();
        pageCache.set(path, html);
        return html;
    }

    async function showPage(path) {
        const root = document.getElementById(containerId);
        try {
            const html = await loadPage(path);
            
            // 1. Вставляем HTML
            // Создаем временный div, чтобы достать только содержимое main
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const content = temp.querySelector('main')?.innerHTML || html;

            await animateSwap(root, content);

            // 2. Очищаем поля (вызываем функцию из calculations.js, если она есть)
            if (typeof clearPageInputs === 'function') {
                clearPageInputs();
            }

            // 3. Скролл вверх
            window.scrollTo(0, 0);

        } catch (err) {
            root.innerHTML = `<div class="card warning">Ошибка: ${err.message}</div>`;
        }
    }

    function animateSwap(root, newHTML) {
        return new Promise(resolve => {
            const newNode = document.createElement("div");
            newNode.className = "page incoming";
            newNode.innerHTML = newHTML;

            const oldNode = root.querySelector(".page.current");
            root.appendChild(newNode);

            requestAnimationFrame(() => {
                newNode.classList.add("enter");
                if (oldNode) oldNode.classList.add("leave");
            });

            setTimeout(() => {
                if (oldNode) root.removeChild(oldNode);
                newNode.classList.remove("incoming", "enter");
                newNode.classList.add("current");
                resolve();
            }, 300);
        });
    }

    function resolveFromHash() {
        const hash = location.hash || "#/home";
        const name = hash.replace(/^#\/?/, "").split("/")[0] || "home";
        return pagesPath + (name === "home" ? "index_content.html" : `${name}.html`);
    }

    function init() {
        if (!document.getElementById(containerId)) {
            const d = document.createElement('div');
            d.id = containerId;
            document.body.append(d);
        }
        window.addEventListener("hashchange", () => showPage(resolveFromHash()));
        showPage(resolveFromHash());
    }

    return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);