module("initialization", {});

test("should be available at the global scope", function() {
  ok(typeof window.grande === "object", "grande should be available at the window");
});
