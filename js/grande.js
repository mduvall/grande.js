(function() {
  var root = this,   // Root object, this is going to be the window for now
      document = this.document, // Safely store a document here for us to use
      editableNodes = document.querySelectorAll(".g-body article"),
      textMenu = document.querySelectorAll(".g-body .text-menu")[0],

      grande = {
        bind: function() {
          bindTextSelectionEvents();
          bindTextStylingEvents();
        },
      };

  function bindTextSelectionEvents() {
    var i,
        len,
        node;

    document.onmousedown = triggerTextSelection;
    document.onmouseup = function(event) {
      setTimeout(function() {
        triggerTextSelection(event);
      }, 1);
    };

    // Handle window resize events
    root.onresize = triggerTextSelection;

    for (i = 0, len = editableNodes.length; i < len; i++) {
      node = editableNodes[i];
      node.onmousedown = node.onkeyup = node.onmouseup = triggerTextSelection;
    }
  }

  function iterateTextMenuButtons(callback) {
    var textMenuButtons = document.querySelectorAll(".g-body .text-menu button"),
        i,
        len,
        node;

    for (i = 0, len = textMenuButtons.length; i < len; i++) {
      node = textMenuButtons[i];

      (function(n) {
        callback(n);
      })(node);
    }
  }

  function bindTextStylingEvents() {
    iterateTextMenuButtons(function(node) {
      node.onmousedown = function(event) {
        triggerTextStyling(node);
      };
    });
  }

  function reloadMenuState() {
    var className;

    iterateTextMenuButtons(function(node) {
      className = node.className;

      switch (true) {
        case /bold/.test(className):
          // TODO: This is a funky case where contenteditable will hack the font-weight
          // instead...need to look out for that as well
          if (hasParentWithTag(window.getSelection().focusNode, "b")) {
            node.className = "bold active";
          } else {
            node.className = "bold";
          }
          break;

        case /italic/.test(className):
          if (hasParentWithTag(window.getSelection().focusNode, "i")) {
            node.className = "italic active";
          } else {
            node.className = "italic";
          }
          break;

        case /header1/.test(className):
          if (hasParentWithTag(window.getSelection().focusNode, "h1")) {
            node.className = "header1 active";
          } else {
            node.className = "header1";
          }
          break;

        case /header2/.test(className):
          if (hasParentWithTag(window.getSelection().focusNode, "h2")) {
            node.className = "header2 active";
          } else {
            node.className = "header2";
          }
          break;

        case /quote/.test(className):
          if (hasParentWithTag(window.getSelection().focusNode, "blockquote")) {
            node.className = "blockquote active";
          } else {
            node.className = "blockquote";
          }
          break;

        case /url/.test(className):
          break;

        default:
          // no default
      }
    });
  }

  function triggerTextStyling(node) {
    var className = node.className;

    switch (true) {
      case /bold/.test(className):
        document.execCommand("bold", false);
        break;

      case /italic/.test(className):
        document.execCommand("italic", false);
        break;

      case /header1/.test(className):
        toggleFormatBlock("h1");
        break;

      case /header2/.test(className):
        toggleFormatBlock("h2");
        break;

      case /quote/.test(className):
        toggleFormatBlock("blockquote");
        break;

      case /url/.test(className):
        break;

      default:
        // no default
    }

    triggerTextSelection();
  }

  function toggleFormatBlock(tag) {
    if (hasParentWithTag(window.getSelection().focusNode, tag)) {
      document.execCommand("formatBlock", false, "p");
      document.execCommand("outdent");
    } else {
      document.execCommand("formatBlock", false, tag);
    }
  }

  function traverseParents(node, condition) {
    while (node.parentNode) {
      if (condition(node)) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }

  function hasParentWithTag(node, nodeType) {
    return traverseParents(node,
      function(n) {
        return n.nodeName.toLowerCase() === nodeType;
      }
    );
  }

  function triggerTextSelection() {
      var selectedText = root.getSelection(),
          range,
          clientRectBounds;

      // The selected text is collapsed, push the menu out of the way
      if (selectedText.isCollapsed) {
        setTextMenuPosition(-999, -999);
      } else {
        range = selectedText.getRangeAt(0);
        clientRectBounds = range.getBoundingClientRect();

        // Every time we show the menu, reload the state
        reloadMenuState();
        setTextMenuPosition(
          clientRectBounds.top - 5 + root.pageYOffset,
          (clientRectBounds.left + clientRectBounds.right) / 2
        );
      }

  }

  function setTextMenuPosition(top, left) {
    textMenu.style.top = top + "px";
    textMenu.style.left = left + "px";
  }

  root.grande = grande;
}).call(this);
