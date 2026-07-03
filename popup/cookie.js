function createElement(element, obj = {}) {
  const newElement = document.createElement(element);
  if (obj.classList) newElement.classList.add(...obj.classList);
  if (obj.className) newElement.className = obj.className;
  if (obj.innerText) newElement.innerText = obj.innerText;
  if (obj.type) newElement.type = obj.type;
  if (obj.value) newElement.value = obj.value;
  if (obj.label) newElement.label = obj.label;
  if (obj.multiple) newElement.multiple = obj.multiple;
  if (obj.onChange) newElement.onchange = obj.onChange;
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

const cookies = browser.cookies.getAll({}).then((cookies) => {
  const select = generateColumnCheckboxes(DEFAULT_COLUMNS);

  const cookieTable = generateCookieTable(cookies);
  for (const selectItem of select) {
    document.body.appendChild(selectItem);
  }
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
        children: opts.columns.map((cookieProperty) => {
          let td = null;
          return createElement("td", {
            thisElement: (element) => {
              td = element;
            },
            className: generateTableClassname(cookieProperty.field),
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
                        createElement("button", {
                          innerText: "copy",
                          className: "copy",
                          onClick: () => {
                            copyTextToClipboard(cookie[cookieProperty.field]);
                          },
                        }),
                        generateEditButton(
                          { getElement: () => td },
                          cookie,
                          cookie[cookieProperty.field],
                        ),
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
    generateCancelButton(tdElement, value),
  );
  td.querySelector("button.copy").replaceWith(
    generateSaveButton(input, cookie),
  );
}

function showText(tdElement, value) {
  const td = tdElement.getElement();
  const p = createElement("p", { innerText: value });
  const valueDiv = td.querySelector(".value");
  valueDiv.replaceChild(p, td.querySelector("input"));
  td.querySelector("button.cancel").replaceWith(
    generateEditButton(tdElement, value),
  );
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

function generateCancelButton(elementObj, value) {
  return createElement("button", {
    innerText: "cancel",
    className: "cancel",
    onClick: () => {
      showText(elementObj, value);
    },
  });
}

function generateSaveButton(input, cookie) {
  return createElement("button", {
    innerText: "save",
    className: "save",
    onClick: () => {
      updateCookie({ ...cookie, value: input.value });
    },
  });
}

function updateCookie(input) {
  const { hostOnly, session, ...rest } = input;
  let getActive = browser.tabs.query({ active: true, currentWindow: true });
  getActive.then((tabs) => {
    const tab = tabs[0].url;
    browser.cookies.set({
      ...rest,
      url: tab,
      /**
       * if domain is just cookie.domain and cookie is hostOnly, addons.firefox.com becomes .addons.firefox.com
       * they are technically two different cookies, so instead of updating, it will create another one
       * if the cookie is hostOnly (e.g. addons.firefox.com), setting domain to undefined will ensure
       * that the cookie with domain addons.firefox.com is updated, otherwise it will just create a new
       * cookie with .addons.firefox.com (as the cookie with this domain does not exist)
       */
      domain: hostOnly ? undefined : cookie.domain,
    });
  });
}
