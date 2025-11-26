/* --- Вспомогательные функции --- */

// Функция для вывода результата
function showResult(elementId, text, isError = false) {
    const el = document.getElementById(elementId || "result");
    if (!el) return;
    el.innerHTML = `<div class="warning" style="display:block; background-color: ${isError ? 'rgba(255, 59, 48, 0.1)' : 'rgba(52, 199, 89, 0.1)'}; color: ${isError ? 'var(--danger-color)' : 'var(--success-color)'}; border-color: ${isError ? 'var(--danger-color)' : 'var(--success-color)'}">${text}</div>`;
}

function clearPageInputs() {
    // 1. Обработка INPUT (числа, текст, чекбоксы)
    document.querySelectorAll("input").forEach(inp => {
        if (inp.type === "checkbox" || inp.type === "radio") {
            // Возвращаем галочку, только если в HTML есть атрибут checked
            inp.checked = inp.defaultChecked; 
        } else {
            // Возвращаем значение, которое прописано в HTML (value="..."), или пустоту
            inp.value = inp.defaultValue; 
        }
    });

    // 2. Обработка SELECT (выпадающие списки)
    document.querySelectorAll("select").forEach(sel => {
        // Ищем опцию, у которой в HTML стоит атрибут selected
        const defaultOpt = Array.from(sel.options).find(opt => opt.defaultSelected);
        if (defaultOpt) {
            sel.value = defaultOpt.value;
        } else {
            // Если ничего не выбрано, ставим первый элемент (placeholder)
            sel.selectedIndex = 0; 
        }
    });

    // 3. Очистка результатов
    // Сбрасываем красивые цифры результатов на прочерки
    document.querySelectorAll(".result-main").forEach(span => span.textContent = "-");
    
    // Скрываем предупреждения
    document.querySelectorAll(".warning").forEach(w => {
        w.style.display = 'none';
        w.textContent = '';
    });
    
    // Для старых страниц (где результат вставляется через innerHTML в div id="result")
    const oldResultDiv = document.getElementById("result");
    if (oldResultDiv) oldResultDiv.innerHTML = "";
}

/* --- Основные расчеты --- */

function densification() {
    const p_target   = parseFloat(document.getElementById("p_target").value);
    const v_initial  = parseFloat(document.getElementById("v_initial").value);
    const p_initial  = parseFloat(document.getElementById("p_initial").value);
    const p_weight   = parseFloat(document.getElementById("p_weighting").value); // Проверь ID в HTML!

    if ([p_target, v_initial, p_initial, p_weight].some(isNaN)) {
        showResult("result", "Заполните все поля корректно", true);
        return;
    }

    const result = v_initial * ((p_target - p_initial) / (p_weight - p_target));
    const result1 = result * p_weight;
    const result2 = result + v_initial;
    const result3 = ((p_target - p_initial) / (p_weight - p_target)) * p_weight;

    // Оформляем красивый вывод
    let html = `
        <p>Добавить утяжелителя на 1 м³: <b>${result3.toFixed(2)} кг</b></p>
        <p>Всего утяжелителя: <b>${result1.toFixed(2)} кг</b></p>
        <p>Конечный объем: <b>${result2.toFixed(2)} м³</b></p>
    `;
    
    document.getElementById("result").innerHTML = html;
}

function mixDensity() {
    const v_add     = parseFloat(document.getElementById("v_add").value);
    const p_add     = parseFloat(document.getElementById("p_add").value);
    const v_initial = parseFloat(document.getElementById("v_initial").value);
    const p_initial = parseFloat(document.getElementById("p_initial").value);

    if ([v_add, p_add, v_initial, p_initial].some(isNaN)) {
        showResult("result", "Заполните все поля", true);
        return;
    }

    const final_density = (v_initial * p_initial + v_add * p_add) / (v_initial + v_add);
    const final_volume = v_initial + v_add;

    let html = `
        <p>Плотность смеси: <b>${final_density.toFixed(2)} кг/м³</b></p>
        <p>Объём смеси: <b>${final_volume.toFixed(2)} м³</b></p>
    `;
    document.getElementById("result").innerHTML = html;
}

function mixVolume() {
    const p_target  = parseFloat(document.getElementById("p_target").value);
    const v_initial = parseFloat(document.getElementById("v_initial").value);
    const p_initial = parseFloat(document.getElementById("p_initial").value);
    const p_add     = parseFloat(document.getElementById("p_add").value);

    if ([p_target, v_initial, p_initial, p_add].some(isNaN)) {
        showResult("result", "Заполните все поля", true);
        return;
    }

    if (p_add === p_target) {
        showResult("result", "Плотность добавки равна требуемой. Расчет невозможен.", true);
        return;
    }

    const result = v_initial * ((p_target - p_initial) / (p_add - p_target));
    const final_volume = result + v_initial;

    if (!isFinite(result) || result < 0) {
        showResult("result", "Некорректные данные (проверьте плотности)", true);
        return;
    }

    let html = `
        <p>Добавить раствора: <b>${result.toFixed(2)} м³</b></p>
        <p>Конечный объём: <b>${final_volume.toFixed(2)} м³</b></p>
    `;
    document.getElementById("result").innerHTML = html;
}

function calculateAlkalinity() {
    const inpPf = document.getElementById('inpPf');
    const inpMfAdd = document.getElementById('inpMfAdd');
    
    const outPf = document.getElementById('outPf');
    const outMf = document.getElementById('outMf');
    const outFinal = document.getElementById('outFinal');
    const warningBox = document.getElementById('warningBox');

    // Сброс предупреждений
    if (warningBox) {
        warningBox.style.display = "none";
        warningBox.textContent = "";
    }

    // Вспомогательная функция внутри (или используем глобальную, если есть)
    const getVal = (el) => {
        if (!el || !el.value) return NaN;
        return parseFloat(el.value.replace(',', '.'));
    };

    const pf = getVal(inpPf);
    const add = getVal(inpMfAdd);
    let mf = null;

    // Логика отображения
    if (!isNaN(pf)) {
        outPf.textContent = pf.toFixed(2);
        
        if (!isNaN(add)) {
            mf = pf + add;
            outMf.textContent = mf.toFixed(2);
            outFinal.textContent = `${pf.toFixed(2)} / ${mf.toFixed(2)}`;
        } else {
            outMf.textContent = "-";
            outFinal.textContent = `${pf.toFixed(2)} / -`;
        }
    } else {
        outPf.textContent = "-";
        outMf.textContent = "-";
        outFinal.textContent = "- / -";
    }

    // Логика предупреждений
    if (!isNaN(pf)) {
        // 1. Pf = 0
        if (pf === 0 && inpPf.value.trim() !== "") {
            warningBox.textContent = "Внимание! Pf = 0. Признак бикарбонатной агрессии.";
            warningBox.style.display = "block";
            return;
        }
        // 2. 2*Pf < Mf
        if (mf !== null && (2 * pf) < mf) {
            warningBox.textContent = "Внимание! 2*Pf < Mf. Признак бикарбонатной агрессии.";
            warningBox.style.display = "block";
        }
    }
}

function calculateChlorides() {
    // Получаем элементы
    const selNormality = document.getElementById('selNormality');
    const inpVolAg = document.getElementById('inpVolAg');
    const inpVolFilt = document.getElementById('inpVolFilt');
    
    const outResult = document.getElementById('outResult');
    const outFormula = document.getElementById('outFormula');

    // Парсим значения
    const N = parseFloat(selNormality.value);
    const V = parseFloat(inpVolAg.value);
    // Если поле пустое, считаем как 1 (стандарт), иначе парсим
    const a = inpVolFilt.value ? parseFloat(inpVolFilt.value) : NaN;

    // Проверяем валидность
    if (!isNaN(N) && !isNaN(V) && !isNaN(a) && a > 0) {
        // Формула: (V * N * 35.5 * 1000) / a
        const result = (V * N * 35.5 * 1000) / a;
        
        // Отображаем результат (округляем до целых, как во Flutter: toStringAsFixed(0))
        outResult.textContent = result.toFixed(0) + " мг/л";
        
        // Показываем подставленную формулу (как было в твоем Flutter коде)
        outFormula.textContent = `(${V} × ${N} × 35.5 × 1000) / ${a}`;
    } else {
        outResult.textContent = "-";
        outFormula.textContent = "(V × N × 35.5 × 1000) / a";
    }
}

function calculateHardness() {
    // Ввод
    const inpVolTrilon = document.getElementById('inpVolTrilon');
    const inpVolFilt = document.getElementById('inpVolFilt');
    
    // Вывод
    const outHardness = document.getElementById('outHardness');
    const outCa = document.getElementById('outCa');
    const outMg = document.getElementById('outMg');
    const outFormula = document.getElementById('outFormula');

    // Значения
    const V = parseFloat(inpVolTrilon.value);
    const a = inpVolFilt.value ? parseFloat(inpVolFilt.value) : NaN;
    const N = 0.1; // Фиксированная нормальность

    if (!isNaN(V) && !isNaN(a) && a > 0) {
        // 1. Общая жесткость (мг-экв/л)
        // Формула: (N * V * 1000) / a
        const hardness = (N * V * 1000) / a;

        // 2. Пересчет в ионы (мг/л)
        const resCa = hardness * 20.04;
        const resMg = hardness * 12.16;

        // Отображение
        outFormula.textContent = `(0.1 × ${V} × 1000) / ${a}`;
        outHardness.textContent = hardness.toFixed(2) + " мг-экв/л";
        
        // Показываем мг/л
        outCa.textContent = resCa.toFixed(2) + " мг/л";
        outMg.textContent = resMg.toFixed(2) + " мг/л";
    } else {
        // Сброс
        outFormula.textContent = "(0.1 × V × 1000) / a";
        outHardness.textContent = "-";
        outCa.textContent = "-";
        outMg.textContent = "-";
    }
}

function calculateMbt() {
    // Ввод
    const inpVolBlue = document.getElementById('inpVolBlue');
    
    // Вывод
    const outContent = document.getElementById('outContent');
    const outFormula = document.getElementById('outFormula');

    // Константы из твоего кода
    const a = 7.125; // Коэффициент
    const V = parseFloat(inpVolBlue.value);

    if (!isNaN(V)) {
        // Формула: C = a * V
        const C = a * V;

        outFormula.textContent = `${a} × ${V}`;
        outContent.textContent = C.toFixed(2) + " кг/м³";
    } else {
        outFormula.textContent = "7.125 × V";
        outContent.textContent = "-";
    }
}

function calculateCalcium() {
    const inpPressure = document.getElementById('inpPressure');
    const selUnit = document.getElementById('selUnit');
    const outResult = document.getElementById('outResult');
    const outPsiInfo = document.getElementById('outPsiInfo');

    if (!inpPressure.value) {
        outResult.textContent = "-";
        outPsiInfo.textContent = "(- PSI)";
        return;
    }

    let pressure = parseFloat(inpPressure.value);
    const unit = selUnit.value;

    // 1. Конвертация в PSI
    // atm -> psi (* 14.6959)
    // mpa -> psi (* 145.0377)
    if (unit === 'atm') pressure *= 14.6959;
    if (unit === 'mpa') pressure *= 145.0377;

    const pressurePsi = pressure; // Сохраняем для расчетов

    // 2. Данные калибровки (Pressure PSI -> CaCO3)
    const data = [
        { p: 1.0, c: 6.0 },
        { p: 4.0, c: 37.0 },
        { p: 6.0, c: 57.8 },
        { p: 7.0, c: 68.0 },
        { p: 11.0, c: 109.8 }
    ];

    let result = 0;

    // 3. Логика интерполяции
    if (pressurePsi < data[0].p) {
        // Если меньше минимума - берем минимум (как в твоем коде предупреждение)
        result = data[0].c;
    } else if (pressurePsi > data[data.length - 1].p) {
        // Если больше максимума - экстраполяция по последним двум точкам
        const pLast = data[data.length - 1];
        const pPrev = data[data.length - 2];
        
        // Формула линейной экстраполяции
        result = pPrev.c + (pressurePsi - pPrev.p) * (pLast.c - pPrev.c) / (pLast.p - pPrev.p);
    } else {
        // Интерполяция внутри диапазона
        for (let i = 0; i < data.length - 1; i++) {
            if (pressurePsi >= data[i].p && pressurePsi <= data[i+1].p) {
                const p1 = data[i];
                const p2 = data[i+1];
                
                result = p1.c + (pressurePsi - p1.p) * (p2.c - p1.c) / (p2.p - p1.p);
                break;
            }
        }
    }

    // Вывод
    outPsiInfo.textContent = `(≈ ${pressurePsi.toFixed(2)} PSI)`;
    outResult.textContent = result.toFixed(1) + " кг/м³";
}

function calculatePotassium() {
    // Ввод
    const inpSediment = document.getElementById('inpSediment');
    const inpVolFiltK = document.getElementById('inpVolFiltK');
    
    // Вывод
    const outKclCurve = document.getElementById('outKclCurve');
    const outC2 = document.getElementById('outC2');
    const outC1 = document.getElementById('outC1');

    if (!inpSediment.value || !inpVolFiltK.value) {
        // Сброс, если пусто
        outKclCurve.textContent = "-";
        outC2.textContent = "-";
        outC1.textContent = "-";
        return;
    }

    const sediment = parseFloat(inpSediment.value);
    const volume = parseFloat(inpVolFiltK.value);

    // 1. Интерполяция по графику (Осадок -> KCl кг/м3)
    // Данные: {vol: объем осадка, kcl: содержание KCl}
    const data = [
        { vol: 0.1, kcl: 4.0 },
        { vol: 0.3, kcl: 13.5 },
        { vol: 0.5, kcl: 23.0 },
        { vol: 1.0, kcl: 46.5 },
        { vol: 1.3, kcl: 60.5 },
        { vol: 1.5, kcl: 69.5 }
    ];

    let kclContent = 0;

    if (sediment < data[0].vol) {
        // Экстраполяция к нулю (0,0)
        const p0 = { vol: 0, kcl: 0 };
        const p1 = data[0];
        kclContent = p0.kcl + (sediment - p0.vol) * (p1.kcl - p0.kcl) / (p1.vol - p0.vol);
    } else if (sediment > data[data.length - 1].vol) {
        // Экстраполяция по последним двум
        const pLast = data[data.length - 1];
        const pPrev = data[data.length - 2];
        kclContent = pPrev.kcl + (sediment - pPrev.vol) * (pLast.kcl - pPrev.kcl) / (pLast.vol - pPrev.vol);
    } else {
        // Внутри диапазона
        for (let i = 0; i < data.length - 1; i++) {
            if (sediment >= data[i].vol && sediment <= data[i+1].vol) {
                const p1 = data[i];
                const p2 = data[i+1];
                kclContent = p1.kcl + (sediment - p1.vol) * (p2.kcl - p1.kcl) / (p2.vol - p1.vol);
                break;
            }
        }
    }

    // 2. Расчет C2 (K+ мг/л)
    // C2 = KCl * 0.5244 * 1000
    const c2 = kclContent * 0.5244 * 1000;

    // 3. Расчет C1 (Итоговый K+ с поправкой на объем)
    // C1 = (7 / V) * C2
    // Если объем равен 0, избегаем деления на ноль
    const c1 = (volume > 0) ? (7.0 / volume) * c2 : 0;

    // Вывод
    outKclCurve.textContent = kclContent.toFixed(2) + " кг/м³";
    outC2.textContent = c2.toFixed(0) + " мг/л";
    outC1.textContent = c1.toFixed(0) + " мг/л";
}