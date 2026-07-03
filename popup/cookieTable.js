const DEFAULT_PROPERTIES = [
  "name",
  "domain",
  "value",
  "expirationDate",
  "secure",
  "sameSite",
];

const DEFAULT_COPY_COLUMNS = ["value"];

function createElement(element, obj = {}) {
  const newElement = document.createElement(element);
  if (obj.classList) newElement.classList.add(...obj.classList);
  if (obj.className) newElement.className = obj.className;
  if (obj.innerText) newElement.innerText = obj.innerText;
  if (obj.children) {
    const childrenArray = Array.isArray(obj.children)
      ? obj.children
      : [obj.children];

    for (const child of childrenArray) {
      newElement.appendChild(child);
    }
  }
  return newElement;
}

function cookieTable(
  cookies,
  opts = {
    properties: DEFAULT_PROPERTIES,
    copyColumns: DEFAULT_COPY_COLUMNS,
  },
) {
  const cookieGroupDiv = createElement("table");
  const thead = createElement("thead", {
    children: cols.map((col) => createElement("th", { innerText: col })),
  });
  cookieGroupDiv.appendChild(thead);

  const tbody = createElement("tbody", {
    children: cookies.map((cookie) => {
      return createElement("tr", {
        children: values.map((cookieProperty) => {
          return createElement("td", {
            children: createElement("div", {
              className: "value",
              children: [
                createElement("p", {
                  innerText: cookie[cookieProperty],
                }),
                createElement("button", {
                  innerText: "copy",
                }),
              ],
            }),
          });
        }),
      });
    }),
  });

  cookieGroupDiv.appendChild(tbody);
}
