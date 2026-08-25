/* =========================================================
   MONEYFLOW FINAL 1.0
========================================================= */

const CATEGORIES = {
  Jedzenie: { icon: "🛒" },
  Samochód: { icon: "⛽" },
  Mieszkanie: { icon: "🏠" },
  Zakupy: { icon: "🛍️" },
  Rozrywka: { icon: "🎮" },
  Praca: { icon: "💰" },
  Zdrowie: { icon: "💊" },
  Rachunki: { icon: "🧾" },
  Inne: { icon: "💸" }
};

const CATEGORY_COLORS = [
  "#397cff",
  "#7650ff",
  "#67e69a",
  "#ffb84d",
  "#ff6873",
  "#55c7ff",
  "#a979ff",
  "#8993a5"
];


/* =========================================================
   DANE
========================================================= */

let transactions = JSON.parse(
  localStorage.getItem("moneyflow_transactions")
);

let budgets = JSON.parse(
  localStorage.getItem("moneyflow_budgets")
);

if (!Array.isArray(transactions)) {
  transactions = [];
  saveTransactions();
}

if (!Array.isArray(budgets)) {
  budgets = [];
  saveBudgets();
}


/* =========================================================
   STAN APLIKACJI
========================================================= */

let transactionType = "expense";
let selectedCategory = "Jedzenie";
let selectedBudgetCategory = "Jedzenie";
let editingTransactionId = null;
let selectedTransactionId = null;
let statsDate = new Date();


/* =========================================================
   ZAPIS
========================================================= */

function saveTransactions() {
  localStorage.setItem(
    "moneyflow_transactions",
    JSON.stringify(transactions)
  );
}

function saveBudgets() {
  localStorage.setItem(
    "moneyflow_budgets",
    JSON.stringify(budgets)
  );
}


/* =========================================================
   FORMATOWANIE
========================================================= */

function money(value) {
  return Number(value).toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " zł";
}

function shortMoney(value) {
  return Number(value).toLocaleString("pl-PL", {
    maximumFractionDigits: 0
  }) + " zł";
}

function dateToString(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function today() {
  return dateToString(new Date());
}

function formatDate(dateString) {
  if (!dateString) {
    return "Brak daty";
  }

  const date = new Date(
    dateString + "T00:00:00"
  );

  return date.toLocaleDateString(
    "pl-PL",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}

function monthName(date) {
  return date.toLocaleDateString(
    "pl-PL",
    {
      month: "long",
      year: "numeric"
    }
  );
}

function capitalize(text) {
  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}


/* =========================================================
   NAWIGACJA
========================================================= */

function navigate(screenName) {

  const screens = {
    home: document.getElementById("homeScreen"),
    transactions: document.getElementById("transactionsScreen"),
    budgets: document.getElementById("budgetsScreen"),
    stats: document.getElementById("statsScreen")
  };

  Object.values(screens).forEach(screen => {
    screen.classList.remove("active");
  });

  if (screens[screenName]) {
    screens[screenName].classList.add("active");
  }

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.screen === screenName
    );
  });

  if (screenName === "home") {
    renderHome();
  }

  if (screenName === "transactions") {
    renderTransactions();
  }

  if (screenName === "budgets") {
    renderBudgets();
  }

  if (screenName === "stats") {
    renderStats();
  }
}


/* =========================================================
   PODSUMOWANIE
========================================================= */

function calculateTotals(list = transactions) {

  let income = 0;
  let expense = 0;

  list.forEach(transaction => {

    const amount =
      Number(transaction.amount) || 0;

    if (transaction.type === "income") {
      income += amount;
    } else {
      expense += amount;
    }

  });

  return {
    income,
    expense,
    balance: income - expense
  };
}


/* =========================================================
   START
========================================================= */

function renderHome() {

  const totals = calculateTotals();

  document.getElementById(
    "balanceValue"
  ).textContent = money(
    totals.balance
  );

  document.getElementById(
    "incomeValue"
  ).textContent =
    "+" + shortMoney(totals.income);

  document.getElementById(
    "expenseValue"
  ).textContent =
    "-" + shortMoney(totals.expense);

  document.getElementById(
    "currentMonthLabel"
  ).textContent =
    capitalize(monthName(new Date()));

  renderHomeChart();
  renderRecentTransactions();
}


/* =========================================================
   WYKRES 7 DNI
========================================================= */

function renderHomeChart() {

  const chart =
    document.getElementById("homeChart");

  const labels =
    document.getElementById("homeChartLabels");

  if (!chart || !labels) return;

  chart.innerHTML = "";
  labels.innerHTML = "";

  const days = [];

  for (let i = 6; i >= 0; i--) {

    const date = new Date();

    date.setHours(0, 0, 0, 0);

    date.setDate(
      date.getDate() - i
    );

    days.push(date);
  }

  const values = days.map(date => {

    const key = dateToString(date);

    return transactions
      .filter(transaction =>
        transaction.type === "expense" &&
        transaction.date === key
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );

  });

  const max = Math.max(...values, 1);

  values.forEach((value, index) => {

    const bar =
      document.createElement("div");

    bar.className = "chart-bar";

    bar.style.height =
      Math.max(
        5,
        (value / max) * 100
      ) + "%";

    chart.appendChild(bar);

    const label =
      document.createElement("span");

    label.textContent =
      days[index]
        .toLocaleDateString(
          "pl-PL",
          { weekday: "short" }
        )
        .slice(0, 2);

    labels.appendChild(label);
  });
}


/* =========================================================
   OSTATNIE TRANSAKCJE
========================================================= */

function renderRecentTransactions() {

  const container =
    document.getElementById(
      "recentTransactions"
    );

  if (!container) return;

  container.innerHTML = "";

  const list =
    [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )
      .slice(0, 5);

  if (!list.length) {

    renderEmpty(
      container,
      "💸",
      "Brak transakcji",
      "Dodaj pierwszą transakcję."
    );

    return;
  }

  list.forEach(transaction => {

    container.appendChild(
      createTransactionElement(
        transaction
      )
    );

  });
}


/* =========================================================
   TRANSAKCJE
========================================================= */

function renderTransactions() {

  const container =
    document.getElementById(
      "transactionList"
    );

  if (!container) return;

  const search =
    (
      document.getElementById(
        "searchInput"
      )?.value || ""
    )
      .toLowerCase()
      .trim();

  container.innerHTML = "";

  const totals =
    calculateTotals();

  document.getElementById(
    "transactionsIncome"
  ).textContent =
    "+" + shortMoney(totals.income);

  document.getElementById(
    "transactionsExpense"
  ).textContent =
    "-" + shortMoney(totals.expense);

  let list =
    [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );

  if (search) {

    list = list.filter(transaction => {

      const text = (
        transaction.name +
        " " +
        transaction.category +
        " " +
        transaction.note
      ).toLowerCase();

      return text.includes(search);

    });
  }

  if (!list.length) {

    renderEmpty(
      container,
      "🔎",
      "Nic nie znaleziono",
      "Spróbuj innej frazy."
    );

    return;
  }

  list.forEach(transaction => {

    container.appendChild(
      createTransactionElement(
        transaction
      )
    );

  });
}


/* =========================================================
   KAFEL TRANSAKCJI
========================================================= */

function createTransactionElement(
  transaction
) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "transaction-wrapper";

  const row =
    document.createElement("div");

  row.className =
    "transaction";

  const isIncome =
    transaction.type === "income";

  const icon =
    transaction.icon ||
    CATEGORIES[
      transaction.category
    ]?.icon ||
    "💸";

  row.innerHTML = `

    <div class="transaction-icon">
      ${icon}
    </div>

    <div class="transaction-main">

      <div class="transaction-name">
        ${escapeHTML(transaction.name)}
      </div>

      <div class="transaction-meta">
        ${escapeHTML(transaction.category)}
        ·
        ${formatDate(transaction.date)}
      </div>

    </div>

    <div
      class="
        transaction-amount
        ${isIncome ? "positive" : "negative"}
      "
    >
      ${isIncome ? "+" : "-"}${shortMoney(
        transaction.amount
      )}
    </div>

  `;

  const deleteButton =
    document.createElement("button");

  deleteButton.className =
    "delete-button";

  deleteButton.textContent =
    "Usuń";

  deleteButton.onclick =
    event => {

      event.stopPropagation();

      deleteTransaction(
        transaction.id
      );

    };

  wrapper.appendChild(row);
  wrapper.appendChild(deleteButton);

  row.onclick = () => {

    openTransactionDetails(
      transaction.id
    );

  };

  enableSwipe(row);

  return wrapper;
}


/* =========================================================
   SWIPE W LEWO
========================================================= */

function enableSwipe(row) {

  let startX = 0;
  let currentX = 0;
  let swiping = false;

  row.addEventListener(
    "touchstart",
    event => {

      startX =
        event.touches[0].clientX;

      currentX =
        startX;

      swiping = true;

      row.style.transition =
        "none";

    },
    {
      passive: true
    }
  );

  row.addEventListener(
    "touchmove",
    event => {

      if (!swiping) return;

      currentX =
        event.touches[0].clientX;

      let distance =
        currentX - startX;

      if (distance > 0) {
        distance = 0;
      }

      if (distance < -85) {
        distance = -85;
      }

      row.style.transform =
        `translate3d(${distance}px,0,0)`;

    },
    {
      passive: true
    }
  );

  row.addEventListener(
    "touchend",
    () => {

      swiping = false;

      const distance =
        currentX - startX;

      row.style.transition =
        "transform .3s cubic-bezier(.22,1,.36,1)";

      if (distance < -40) {

        row.style.transform =
          "translate3d(-85px,0,0)";

      } else {

        row.style.transform =
          "translate3d(0,0,0)";

      }

    }
  );
}


/* =========================================================
   MODAL TRANSAKCJI
========================================================= */

function openTransactionModal(id = null) {

  editingTransactionId = id;

  renderCategoryButtons();

  if (id) {

    const transaction =
      transactions.find(
        item => item.id === id
      );

    if (!transaction) return;

    document.getElementById(
      "transactionModalTitle"
    ).textContent =
      "Edytuj transakcję";

    transactionType =
      transaction.type;

    selectedCategory =
      transaction.category;

    document.getElementById(
      "transactionAmount"
    ).value =
      transaction.amount;

    document.getElementById(
      "transactionName"
    ).value =
      transaction.name;

    document.getElementById(
      "transactionDate"
    ).value =
      transaction.date || today();

    document.getElementById(
      "transactionNote"
    ).value =
      transaction.note || "";

  } else {

    document.getElementById(
      "transactionModalTitle"
    ).textContent =
      "Nowa transakcja";

    transactionType =
      "expense";

    selectedCategory =
      "Jedzenie";

    document.getElementById(
      "transactionAmount"
    ).value = "";

    document.getElementById(
      "transactionName"
    ).value = "";

    document.getElementById(
      "transactionDate"
    ).value = today();

    document.getElementById(
      "transactionNote"
    ).value = "";
  }

  updateTypeButtons();

  document
    .getElementById(
      "transactionModal"
    )
    .classList.add("show");
}


function closeTransactionModal() {

  document
    .getElementById(
      "transactionModal"
    )
    .classList.remove("show");

  editingTransactionId = null;
}


/* =========================================================
   WYDATEK / PRZYCHÓD
========================================================= */

function setTransactionType(type) {

  transactionType = type;

  updateTypeButtons();
}


function updateTypeButtons() {

  const expenseButton =
    document.getElementById(
      "expenseTypeButton"
    );

  const incomeButton =
    document.getElementById(
      "incomeTypeButton"
    );

  expenseButton.classList.remove(
    "selected-expense"
  );

  incomeButton.classList.remove(
    "selected-income"
  );

  if (
    transactionType ===
    "expense"
  ) {

    expenseButton.classList.add(
      "selected-expense"
    );

  } else {

    incomeButton.classList.add(
      "selected-income"
    );

  }
}


/* =========================================================
   KATEGORIE
========================================================= */

function renderCategoryButtons() {

  const container =
    document.getElementById(
      "categoryGrid"
    );

  if (!container) return;

  container.innerHTML = "";

  Object.entries(
    CATEGORIES
  ).forEach(
    ([name, data]) => {

      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "category-choice";

      if (
        selectedCategory ===
        name
      ) {

        button.classList.add(
          "selected"
        );

      }

      button.innerHTML = `
        <span>${data.icon}</span>
        ${name}
      `;

      button.onclick = () => {

        selectedCategory =
          name;

        renderCategoryButtons();

      };

      container.appendChild(
        button
      );

    }
  );
}


/* =========================================================
   ZAPIS TRANSAKCJI
========================================================= */

function saveTransaction() {

  const amount =
    Number(
      document.getElementById(
        "transactionAmount"
      ).value
    );

  const name =
    document.getElementById(
      "transactionName"
    ).value.trim();

  const date =
    document.getElementById(
      "transactionDate"
    ).value || today();

  const note =
    document.getElementById(
      "transactionNote"
    ).value.trim();

  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "Wpisz poprawną kwotę."
    );

    return;
  }

  if (!name) {

    alert(
      "Wpisz nazwę transakcji."
    );

    return;
  }

  if (editingTransactionId) {

    const transaction =
      transactions.find(
        item =>
          item.id ===
          editingTransactionId
      );

    if (transaction) {

      transaction.amount =
        amount;

      transaction.name =
        name;

      transaction.date =
        date;

      transaction.note =
        note;

      transaction.category =
        selectedCategory;

      transaction.type =
        transactionType;

      transaction.icon =
        CATEGORIES[
          selectedCategory
        ].icon;

    }

  } else {

    transactions.unshift({

      id: Date.now(),

      amount,
      name,
      date,
      note,

      category:
        selectedCategory,

      type:
        transactionType,

      icon:
        CATEGORIES[
          selectedCategory
        ].icon

    });

  }

  saveTransactions();

  closeTransactionModal();

  refresh();
}


/* =========================================================
   SZCZEGÓŁY
========================================================= */

function openTransactionDetails(id) {

  const transaction =
    transactions.find(
      item => item.id === id
    );

  if (!transaction) return;

  selectedTransactionId = id;

  const isIncome =
    transaction.type === "income";

  document.getElementById(
    "detailsTitle"
  ).textContent =
    transaction.name;

  document.getElementById(
    "detailsCategory"
  ).textContent =
    transaction.category;

  const amount =
    document.getElementById(
      "detailsAmount"
    );

  amount.textContent =
    (isIncome ? "+" : "-") +
    shortMoney(
      transaction.amount
    );

  amount.className =
    "details-amount " +
    (
      isIncome
        ? "positive"
        : "negative"
    );

  document.getElementById(
    "detailsDate"
  ).textContent =
    formatDate(
      transaction.date
    );

  document.getElementById(
    "detailsNote"
  ).textContent =
    transaction.note ||
    "Brak notatki";

  document
    .getElementById(
      "detailsModal"
    )
    .classList.add("show");
}


function closeDetailsModal() {

  document
    .getElementById(
      "detailsModal"
    )
    .classList.remove("show");

  selectedTransactionId =
    null;
}


function editCurrentTransaction() {

  if (
    selectedTransactionId ===
    null
  ) return;

  const id =
    selectedTransactionId;

  closeDetailsModal();

  openTransactionModal(id);
}


function deleteCurrentTransaction() {

  if (
    selectedTransactionId ===
    null
  ) return;

  deleteTransaction(
    selectedTransactionId
  );

  closeDetailsModal();
}


/* =========================================================
   USUWANIE
========================================================= */

function deleteTransaction(id) {

  transactions =
    transactions.filter(
      item => item.id !== id
    );

  saveTransactions();

  refresh();
}


/* =========================================================
   BUDŻETY
========================================================= */

function openBudgetModal() {

  selectedBudgetCategory =
    "Jedzenie";

  document.getElementById(
    "budgetAmount"
  ).value = "";

  renderBudgetCategoryButtons();

  document
    .getElementById(
      "budgetModal"
    )
    .classList.add("show");
}


function closeBudgetModal() {

  document
    .getElementById(
      "budgetModal"
    )
    .classList.remove("show");
}


function renderBudgetCategoryButtons() {

  const container =
    document.getElementById(
      "budgetCategoryGrid"
    );

  if (!container) return;

  container.innerHTML = "";

  Object.entries(
    CATEGORIES
  ).forEach(
    ([name, data]) => {

      if (name === "Praca") {
        return;
      }

      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "category-choice";

      if (
        selectedBudgetCategory ===
        name
      ) {

        button.classList.add(
          "selected"
        );

      }

      button.innerHTML = `
        <span>${data.icon}</span>
        ${name}
      `;

      button.onclick = () => {

        selectedBudgetCategory =
          name;

        renderBudgetCategoryButtons();

      };

      container.appendChild(
        button
      );

    }
  );
}


function saveBudget() {

  const amount =
    Number(
      document.getElementById(
        "budgetAmount"
      ).value
    );

  if (
    !amount ||
    amount <= 0
  ) {

    alert(
      "Wpisz poprawny limit."
    );

    return;
  }

  const existing =
    budgets.find(
      budget =>
        budget.category ===
        selectedBudgetCategory
    );

  if (existing) {

    existing.amount =
      amount;

  } else {

    budgets.push({

      id: Date.now(),

      category:
        selectedBudgetCategory,

      amount

    });

  }

  saveBudgets();

  closeBudgetModal();

  renderBudgets();
}


/* =========================================================
   BUDŻETY — WIDOK
========================================================= */

function getCategoryExpense(
  category
) {

  return transactions
    .filter(
      transaction =>
        transaction.type ===
          "expense" &&
        transaction.category ===
          category
    )
    .reduce(
      (total, transaction) =>
        total +
        Number(
          transaction.amount
        ),
      0
    );
}


function renderBudgets() {

  const container =
    document.getElementById(
      "budgetList"
    );

  if (!container) return;

  container.innerHTML = "";

  if (!budgets.length) {

    renderEmpty(
      container,
      "🎯",
      "Brak budżetów",
      "Dodaj limit dla wybranej kategorii."
    );

    return;
  }

  budgets.forEach(budget => {

    const spent =
      getCategoryExpense(
        budget.category
      );

    const percentage =
      Math.min(
        100,
        (
          spent /
          budget.amount
        ) * 100
      );

    const exceeded =
      spent >
      budget.amount;

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "budget-card";

    card.innerHTML = `

      <div class="budget-top">

        <div class="budget-name">

          <div class="budget-icon">
            ${
              CATEGORIES[
                budget.category
              ]?.icon || "💸"
            }
          </div>

          <span>
            ${escapeHTML(
              budget.category
            )}
          </span>

        </div>

        <div class="budget-number">

          <strong>
            ${shortMoney(spent)}
          </strong>

          <small>
            z ${shortMoney(
              budget.amount
            )}
          </small>

        </div>

      </div>

      <div class="progress">

        <div
          class="
            progress-bar
            ${exceeded ? "danger" : ""}
          "
          style="
            width:${percentage}%
          "
        ></div>

      </div>

      <div
        class="
          budget-status
          ${exceeded ? "danger" : ""}
        "
      >

        ${
          exceeded
            ? "⚠️ Przekroczono o " +
              shortMoney(
                spent -
                budget.amount
              )
            : "Pozostało " +
              shortMoney(
                budget.amount -
                spent
              )
        }

      </div>

    `;

    container.appendChild(
      card
    );

  });
}


/* =========================================================
   STATYSTYKI
========================================================= */

function changeStatsMonth(
  direction
) {

  statsDate.setMonth(
    statsDate.getMonth() +
    direction
  );

  renderStats();
}


function getStatsTransactions() {

  const year =
    statsDate.getFullYear();

  const month =
    statsDate.getMonth();

  return transactions.filter(
    transaction => {

      if (!transaction.date) {
        return true;
      }

      const date =
        new Date(
          transaction.date +
          "T00:00:00"
        );

      return (
        date.getFullYear() ===
          year &&
        date.getMonth() ===
          month
      );

    }
  );
}


function renderStats() {

  const list =
    getStatsTransactions();

  const expenses =
    list.filter(
      transaction =>
        transaction.type ===
        "expense"
    );

  const total =
    expenses.reduce(
      (sum, transaction) =>
        sum +
        Number(
          transaction.amount
        ),
      0
    );

  document.getElementById(
    "statsMonth"
  ).textContent =
    capitalize(
      monthName(statsDate)
    );

  document.getElementById(
    "statsTotal"
  ).textContent =
    shortMoney(total);

  document.getElementById(
    "donutValue"
  ).textContent =
    shortMoney(total);

  document.getElementById(
    "statsTransactionCount"
  ).textContent =
    expenses.length +
    (
      expenses.length === 1
        ? " transakcja"
        : " transakcji"
    );

  const categoryTotals = {};

  expenses.forEach(
    transaction => {

      if (
        !categoryTotals[
          transaction.category
        ]
      ) {

        categoryTotals[
          transaction.category
        ] = 0;

      }

      categoryTotals[
        transaction.category
      ] +=
        Number(
          transaction.amount
        );

    }
  );

  const categories =
    Object.entries(
      categoryTotals
    ).sort(
      (a, b) =>
        b[1] - a[1]
    );

  if (categories.length) {

    document.getElementById(
      "largestCategory"
    ).textContent =
      categories[0][0] +
      " · " +
      shortMoney(
        categories[0][1]
      );

  } else {

    document.getElementById(
      "largestCategory"
    ).textContent =
      "Brak danych";

  }

  renderDonut(
    categories,
    total
  );

  renderCategoryList(
    categories,
    total
  );
}


/* =========================================================
   WYKRES KOŁOWY
========================================================= */

function renderDonut(
  categories,
  total
) {

  const donut =
    document.getElementById(
      "donut"
    );

  if (!donut) return;

  if (
    !categories.length ||
    !total
  ) {

    donut.style.background =
      "#292f39";

    return;
  }

  let current = 0;

  const parts =
    categories.map(
      ([category, amount], index) => {

        const degrees =
          (
            amount /
            total
          ) * 360;

        const start =
          current;

        current +=
          degrees;

        return `
          ${
            CATEGORY_COLORS[
              index %
              CATEGORY_COLORS.length
            ]
          }
          ${start}deg
          ${current}deg
        `;

      }
    );

  donut.style.background =
    `conic-gradient(
      ${parts.join(",")}
    )`;
}


/* =========================================================
   KATEGORIE W STATYSTYKACH
========================================================= */

function renderCategoryList(
  categories,
  total
) {

  const container =
    document.getElementById(
      "categoryList"
    );

  if (!container) return;

  container.innerHTML = "";

  if (!categories.length) {

    renderEmpty(
      container,
      "📊",
      "Brak wydatków",
      "Dodaj transakcję, aby zobaczyć statystyki."
    );

    return;
  }

  categories.forEach(
    ([category, amount], index) => {

      const percentage =
        (
          amount /
          total
        ) * 100;

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "category-row";

      const color =
        CATEGORY_COLORS[
          index %
          CATEGORY_COLORS.length
        ];

      row.innerHTML = `

        <div class="category-row-top">

          <span>
            ${
              CATEGORIES[
                category
              ]?.icon || "💸"
            }

            ${escapeHTML(
              category
            )}
          </span>

          <strong>
            ${shortMoney(amount)}
            ·
            ${percentage.toFixed(0)}%
          </strong>

        </div>

        <div class="category-progress">

          <div
            class="category-fill"
            style="
              width:${percentage}%;
              background:${color}
            "
          ></div>

        </div>

      `;

      container.appendChild(
        row
      );

    }
  );
}


/* =========================================================
   PUSTY EKRAN
========================================================= */

function renderEmpty(
  container,
  icon,
  title,
  text
) {

  container.innerHTML = `

    <div class="empty">

      <div class="empty-icon">
        ${icon}
      </div>

      <h3>
        ${title}
      </h3>

      <div>
        ${text}
      </div>

    </div>

  `;
}


/* =========================================================
   ODŚWIEŻANIE
========================================================= */

function refresh() {

  renderHome();
  renderTransactions();
  renderBudgets();
  renderStats();

}


/* =========================================================
   ZAMYKANIE MODALI PO KLIKNIĘCIU W TŁO
========================================================= */

document
  .querySelectorAll(".modal")
  .forEach(modal => {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          modal
        ) {

          modal.classList.remove(
            "show"
          );

        }

      }
    );

  });


/* =========================================================
   URUCHOMIENIE
========================================================= */

document.getElementById(
  "transactionDate"
).value =
  today();

renderCategoryButtons();

renderBudgetCategoryButtons();

refresh();

navigate("home");
