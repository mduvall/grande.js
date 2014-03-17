module("grande initialization");

test("it should be available at the global scope", function() {
  ok(typeof window.Grande === "function",
    "Grande should be available at the window");
});


module("event bindings", {
  teardown: function() {
    unbind();
  }
});

test("it should bind onblur and onfocus when using placeholders", function () {
  var editableNode = document.querySelectorAll(".g-body article")[0];

  new Grande([editableNode], {placeholder: 'Enter text'});

  ok(typeof editableNode.onfocus === "function",
    "editableNode.onfocus should be bound to a function.");
  ok(typeof editableNode.onblur === "function",
    "editableNode.onblur should be bound to a function.");
});

test("it should bind mousedown, mouseup, and keyup on the nodes", function() {
  var editableNode = document.querySelectorAll(".g-body article")[0];
  ok(editableNode.onmousedown === null,
    "editableNode mousedown should be null");
  ok(editableNode.onmouseup === null,
    "editableNode mouseup should be null");
  ok(editableNode.onkeyup === null,
    "editableNode keyup should be null");
  ok(editableNode.onkeydown === null,
    "editableNode keyup should be null");

  new Grande();

  ok(typeof editableNode.onmousedown === "function",
    "editableNode mousedown should be bound to a function");
  ok(typeof editableNode.onmouseup === "function",
    "editableNode mouseup should be bound to a function");
  ok(typeof editableNode.onkeyup === "function",
    "editableNode keyup should be bound to a function");
  ok(typeof editableNode.onkeydown === "function",
    "editableNode keydown should be bound to a function");
});

test("it should bind to the windows resize event", function() {
  ok(window.onresize === null,
    "window resize should be null");

  new Grande();

  ok(typeof window.onresize === "function",
    "window resize should be bound to a function");
});

test("it should attach the toolbar template to the DOM", function() {
  equal(document.querySelectorAll(".text-menu").length, 0,
    "text menu should not be defined on the dom");

  new Grande();

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

