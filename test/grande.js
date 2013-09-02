module("grande initialization");

test("it should be available at the global scope", function() {
  ok(typeof window.grande === "object", "grande should be available at the window");
});

module("public API");

test("it should provide bind as a method", function() {
  ok(typeof window.grande.bind === "function", "bind should be a public API method");
});

test("it should provide select as a method", function() {
  ok(typeof window.grande.select === "function", "select should be a public API method");
});
