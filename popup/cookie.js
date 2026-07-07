/**
 * 
 * @param {*} element 
 * @param {*} obj 
 * @returns {Element} element
 */
function createElement(element, obj = {}) {
  const newElement = document.createElement(element);
  if (obj.classList) newElement.classList.add(...obj.classList.filter(Boolean));
  if (obj.className) newElement.className = obj.className;
  if (obj.innerText) newElement.innerText = obj.innerText;
  if (obj.type) newElement.type = obj.type;
  if (obj.value) newElement.value = obj.value;
  if (obj.label) newElement.label = obj.label;
  if (obj.multiple) newElement.multiple = obj.multiple;
  if (obj.onChange) newElement.onchange = obj.onChange;
  if (obj.onInput) newElement.oninput = obj.onInput;
  if (obj.onClick) newElement.onclick = obj.onClick;
  if (obj.children) {
    const childrenArray = Array.isArray(obj.children)
      ? obj.children
      : [obj.children];

    for (const child of childrenArray) {
      newElement.appendChild(child);
    }
  }
  if (obj.thisElement) {
    obj.thisElement(newElement);
  }
  return newElement;
}

const cookies = getCurrentCookies().then((cookies) => {
  const select = generateColumnCheckboxes(DEFAULT_COLUMNS);
  const selectSort = generateSortSelect(DEFAULT_COLUMNS)
  const filterInput = generateFilterInput()

  const cookieTable = generateCookieTable(cookies);
  for (const selectItem of select) {
    document.body.appendChild(selectItem);
  }
  document.body.appendChild(selectSort)
  document.body.appendChild(filterInput)
  document.body.appendChild(cookieTable);
});

const DEFAULT_COLUMNS = [
  { name: "name", field: "name" },
  { name: "domain", field: "domain" },
  { name: "value", field: "value" },
  { name: "expires", field: "expirationDate" },
  { name: "secure", field: "secure" },
  { name: "same site", field: "sameSite" },
];

const DEFAULT_COPY_COLUMNS = ["value"];

function generateCookieTable(
  cookies,
  opts = {
    columns: DEFAULT_COLUMNS,
    copyColumns: DEFAULT_COPY_COLUMNS,
  },
) {
  const cookieGroupDiv = createElement("table");
  const thead = createElement("thead", {
    children: opts.columns.map((col) =>
      createElement("th", {
        className: generateTableClassname(col.field),
        innerText: col.name,
      }),
    ),
  });
  cookieGroupDiv.appendChild(thead);

  const tbody = createElement("tbody", {
    children: cookies.map((cookie) => {
      return createElement("tr", {
        className: cookie.isPinned ? 'pinned-row' : undefined,
        children: opts.columns.map((cookieProperty, i) => {
          let td = null;
          return createElement("td", {
            thisElement: (element) => {
              td = element;
            },
            classList: [generateTableClassname(cookieProperty.field)],
            children: createElement("div", {
              className: "value",
              children: [
                createElement("p", {
                  innerText: cookie[cookieProperty.field],
                }),
                createElement("div", {
                  className: "value-btns",
                  children: opts.copyColumns.includes(cookieProperty.field)
                    ? [
                        generateCopyButton(cookie[cookieProperty.field]),
                        generateEditButton(
                          { getElement: () => td },
                          cookie,
                          cookie[cookieProperty.field],
                        ),
                        generatePinButton(cookie)
                      ]
                    : [],
                }),
              ],
            }),
          });
        }),
      });
    }),
  });

  cookieGroupDiv.appendChild(tbody);

  return cookieGroupDiv;
}

function generateColumnCheckboxes(columns) {
  return columns.map((column) => {
    return createElement("label", {
      type: "checkbox",
      innerText: column.name,
      onChange: (e) => toggleColumn(column.field, e.target.checked),
      children: createElement("input", {
        type: "checkbox",
        value: column.field,
      }),
    });
  });
}

function generateSortSelect(columns) {
  const select = createElement("select")
  const options = columns.map((column) => {
     select.append(createElement("option", {
      label: column.name,
      value: column.field
    }));
  });

  
  return select
}

function generateFilterInput() {
  const input = createElement("label", {
    innerText: "Filter",
    children: createElement("input", {
      type: "text",
      className: 'filter-input',
      onInput: (e) => {
        const cookies = getCurrentCookies({ filter: e.target.value }).then(cookies => refreshCookieTable(cookies))
      }
    })
  })
  
  return input
}

function generateTableClassname(name) {
  return `table-${name}`;
}

function toggleColumn(column, isChecked) {
  const columnName = generateTableClassname(column);
  const tableElements = document.querySelectorAll(`.${columnName}`);
  for (const tableElement of tableElements) {
    if (!isChecked) {
      tableElement.classList.add("hidden");
    } else {
      tableElement.classList.remove("hidden");
    }
  }
}

function copyTextToClipboard(text) {
  navigator.clipboard.writeText(text);
}

function showEdit(tdElement, cookie, value) {
  const td = tdElement.getElement();
  const input = createElement("input", { value });
  const valueDiv = td.querySelector(".value");
  valueDiv.replaceChild(input, td.querySelector("p"));
  td.querySelector("button.edit").replaceWith(
    generateCancelButton(tdElement, cookie, value),
  );
  td.querySelector("button.copy").replaceWith(
    generateSaveButton(input, cookie),
  );
}

function showText(tdElement, cookie,value) {
  const td = tdElement.getElement();
  const p = createElement("p", { innerText: value });
  const valueDiv = td.querySelector(".value");
  valueDiv.replaceChild(p, td.querySelector("input"));
  td.querySelector("button.cancel")?.replaceWith(
    generateEditButton(tdElement, cookie, value),
  );
  td.querySelector("button.save")?.replaceWith(generateCopyButton(value));
}

function generateEditButton(elementObj, cookie, value) {
  return createElement("button", {
    innerText: "edit",
    className: "edit",
    onClick: () => {
      showEdit(elementObj, cookie, value);
    },
  });
}

function generateCancelButton(elementObj,cookie, value) {
  return createElement("button", {
    innerText: "cancel",
    className: "cancel",
    onClick: () => {
      showText(elementObj, cookie, value);
    },
  });
}

function generateSaveButton(input, cookie) {
  return createElement("button", {
    innerText: "save",
    className: "save",
    onClick: () => {
      updateCookie({ ...cookie, value: input.value }).then(() => {
        getCurrentCookies().then((cookies) => {
          const cookieTable = generateCookieTable(cookies);
          document.querySelector("table").replaceWith(cookieTable);
        });
      });
    },
  });
}

function generateCopyButton(value) {
  return createElement("button", {
    innerText: "copy",
    className: "copy",
    onClick: () => {
      copyTextToClipboard(value);
    },
  });
}

function generatePinButton(cookie) {
  return createElement("button", {
    innerText: !cookie.isPinned ? "pin" : 'unpin',
    className: "pin",
    onClick: () => {
      if (!cookie.isPinned) setPinnedCookie(cookie)
      else unpinCookie(cookie)
      getCurrentCookies({ filter: getFilterInputValue() }).then(cookies => refreshCookieTable(cookies))
    },
  });
}

function updateCookie(input) {
  const { hostOnly, session, isPinned, ...rest } = input;
  let getActive = browser.tabs.query({ active: true, currentWindow: true });
  return getActive.then((tabs) => {
    const tab = tabs[0].url;
    return browser.cookies.set({
      ...rest,
      url: tab,
      /**
       * if domain is just cookie.domain and cookie is hostOnly, addons.firefox.com becomes .addons.firefox.com
       * they are technically two different cookies, so instead of updating, it will create another one
       * if the cookie is hostOnly (e.g. addons.firefox.com), setting domain to undefined will ensure
       * that the cookie with domain addons.firefox.com is updated, otherwise it will just create a new
       * cookie with .addons.firefox.com (as the cookie with this domain does not exist)
       */
      domain: hostOnly ? undefined : input.domain,
    });
  });
}

const PINNED_COOKIES_STORAGE_KEY = 'pinned_cookies'

function setPinnedCookie(cookie) {
  const key = PINNED_COOKIES_STORAGE_KEY
  const currentValue = localStorage.getItem(key)
  const parsedCurrentvalue = currentValue ? JSON.parse(currentValue) : []

  return localStorage.setItem(key, JSON.stringify(parsedCurrentvalue.concat([{ name: cookie.name, domain: cookie.domain, url: cookie.url }])))
}

function unpinCookie(cookie) {
  const key = PINNED_COOKIES_STORAGE_KEY
  const currentValue = localStorage.getItem(key)
  const parsedCurrentvalue = currentValue ? JSON.parse(currentValue) : []

  localStorage.setItem(key, JSON.stringify(parsedCurrentvalue.filter(storageCookie => !(storageCookie.name === cookie.name && storageCookie.domain === cookie.domain) )))
}

function getPinnedCookies() {
  return JSON.parse(localStorage.getItem(PINNED_COOKIES_STORAGE_KEY) || "[]")
}


const FILTERABLE_VALUES = [
  {
    name: 'name',
    field: 'name'
  },
  {
    name: 'value',
    field: 'value'
  },
  {
    name: 'domain',
    field: 'domain'
  },
]

async function getCurrentCookies({ filter, sort } = { filter: '', sort: ''}) {
  const tabs = await browser.tabs.query({active: true, currentWindow: true})
  const tab = tabs[0]
  const url = tab.url
  const cookies = await browser.cookies.getAll({ url })
  const allPinnedCookies = getPinnedCookies()
  let mappedCookies = cookies.map(tabCookie => {
    const isPinned = allPinnedCookies.some(pinnedCookie => pinnedCookie.name === tabCookie.name && pinnedCookie.domain === tabCookie.domain)
    return {
      ...tabCookie,
      isPinned
    }
  })
  if (filter && filter !== '') {
    mappedCookies = mappedCookies.filter(cookie => {
      return FILTERABLE_VALUES.some(value => cookie[value.field].toLowerCase().includes(filter.toLowerCase()))
    })
  }

  mappedCookies.sort((aCookie, bCookie) => {
    if (aCookie.isPinned && bCookie.isPinned) return 0
    if (aCookie.isPinned && !bCookie.isPinned) return -1
    if (!aCookie.isPinned && bCookie.isPinned) return 1
    return aCookie[sort || "name"].localeCompare(bCookie[sort || "name"])
  })
  return mappedCookies
}
function refreshCookieTable(cookies) {
  const cookieTable = generateCookieTable(cookies);
  document.querySelector("table").replaceWith(cookieTable);
}

function getFilterInputValue() {
  return document.querySelector('input[type=text].filter-input')?.value
}