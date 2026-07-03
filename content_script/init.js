console.log("init js");

console.log(browser.runtime);
browser.runtime.onMessage = function (data) {
  console.log(data);
};
