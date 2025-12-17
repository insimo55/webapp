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

    /* -----------------------------
       Управление системной кнопкой Назад
       ----------------------------- */
    function updateBackButton() {
        const page = location.hash.replace("#/", "");
        if (tg) {
            if (page && page !== "home") {
                tg.BackButton.show();
            } else {
                tg.BackButton.hide();
            }
        }
    }

    if (tg) {
        tg.BackButton.onClick(() => {
            location.hash = "#/home";
        });
    }

    /* -----------------------------
       Загрузка HTML (с кешем)
       ----------------------------- */
    async function loadPage(path) {
        if (pageCache.has(path)) return pageCache.get(path);
        const res = await fetch(path);

        if (!res.ok) throw new Error("404");

        const html = await res.text();
        pageCache.set(path, html);
        return html;
    }

    /* -----------------------------
       Плавная смена страниц
       ----------------------------- */
    async function showPage(path) {
        const root = document.getElementById(containerId);
        try {
            const html = await loadPage(path);

            // достаём содержимое <main>
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const content = temp.querySelector('main')?.innerHTML || html;

            await animateSwap(root, content);

            // очистка форм, если существует
            if (typeof clearPageInputs === 'function') {
                clearPageInputs();
            }

            window.scrollTo(0, 0); // вверх

            updateBackButton(); // <── обновляем кнопку назад

        } catch (err) {
            root.innerHTML = `<div class="card warning">Ошибка: ${err.message}</div>`;
        }
    }

    /* -----------------------------
       Анимация переключения страниц
       ----------------------------- */
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

    /* -----------------------------
       Определение страницы по hash
       ----------------------------- */
    function resolveFromHash() {
        let hash = location.hash.split("?")[0]; 
        if (!hash || !hash.startsWith("#/")) hash = "#/home";

        const name = hash.replace(/^#\/?/, "").split("/")[0] || "home";
        return pagesPath + (name === "home" ? "index_content.html" : `${name}.html`);
    }

    /* -----------------------------
       Инициализация приложения
       ----------------------------- */
    function init() {
        if (!document.getElementById(containerId)) {
            const d = document.createElement('div');
            d.id = containerId;
            document.body.append(d);
        }

        window.addEventListener("hashchange", () => {
            showPage(resolveFromHash());
        });

        showPage(resolveFromHash());
    }

    return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);


const logo = document.getElementById('logo');

function updateLogoTheme() {
    if (tg.colorScheme === 'dark') {
        logo.src = 'logo_white.svg';
    } else {
        logo.src = 'logo.svg';
    }
}

// при старте
updateLogoTheme();

// если пользователь сменил тему в Telegram
tg.onEvent('themeChanged', updateLogoTheme);