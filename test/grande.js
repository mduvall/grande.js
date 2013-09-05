module("grande initialization");

test("it should be available at the global scope", function() {
  ok(typeof window.grande === "object",
    "grande should be available at the window");
});


module("public api");

test("it should provide bind as a method", function() {
  ok(typeof window.grande.bind === "function",
    "bind should be a public api method");
});

test("it should provide select as a method", function() {
  ok(typeof window.grande.select === "function",
    "select should be a public API method");
});


module("event bindings", {
  teardown: function() {
    unbind();
  }
});

test("it should bind the same events to the editableNode mousedown,keyup,mouseup", function() {
  var editableNode = document.querySelectorAll(".g-body article")[0];

  grande.bind();

  ok(editableNode.onmousedown === editableNode.onkeyup,
    "mousedown, keyup, and mouseup should delegate to the same function");
  ok(editableNode.onmousedown === editableNode.onmouseup,
    "mousedown, keyup, and mouseup should delegate to the same function");
});

test("it should bind mousedown, mouseup, and keyup on the document", function() {
  ok(document.onmousedown === null,
    "document mousedown should be null");
  ok(document.onmouseup === null,
    "document mouseup should be null");
  ok(document.onkeyup === null,
    "document keyup should be null");

  grande.bind();

  ok(typeof document.onmousedown === "function",
    "document mousedown should be bound to a function");
  ok(typeof document.onmouseup === "function",
    "document mouseup should be bound to a function");
  ok(typeof document.onkeyup === "function",
    "document keyup should be bound to a function");
});

test("it should bind to the windows resize event", function() {
  ok(window.onresize === null,
    "window resize should be null");

  grande.bind();

  ok(typeof window.onresize === "function",
    "window resize should be bound to a function");
});

test("it should attach the toolbar template to the DOM", function() {
  equal(document.querySelectorAll(".text-menu").length, 0,
    "text menu should not be defined on the dom");

  grande.bind();

  equal(document.querySelectorAll(".text-menu").length, 1,
    "text menu should be defined on the dom");
});


function unbind() {
  document.onmousedown =
    document.onmouseup =
      document.onkeyup =
       window.onresize = null;

  var menuEl = document.querySelectorAll(".text-menu");
  if (menuEl.length) {
    menuEl[0].parentNode.removeChild(menuEl[0]);
  }
}

