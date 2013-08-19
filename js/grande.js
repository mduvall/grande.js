(function() {
  var root = this,   // Root object, this is going to be the window for now
      document = this.document, // Safely store a document here for us to use
      editableNodes = document.querySelectorAll(".g-body header, .g-body article"),
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

    for (i = 0, len = editableNodes.length; i < len; i++) {
      node = editableNodes[i];
      node.onmousedown = node.onkeyup = node.onmouseup = triggerTextSelection;
    }
  };

  function bindTextStylingEvents() {
    var textMenuButtons = document.querySelectorAll(".g-body .text-menu button"),
        i,
        len,
        node;

    for (i = 0, len = textMenuButtons.length; i < len; i++) {
      node = textMenuButtons[i];

      (function(n) {
        n.onmousedown = function(event) {
          triggerTextStyling(n);
        }
      }(node));
    }
  }

  function triggerTextStyling(node) {
    className = node.className;

    switch (true) {
      case /bold/.test(className):
        document.execCommand('bold', false);
        break;

      case /italic/.test(className):
        document.execCommand('italic', false);
        break;

      case /header1/.test(className):
        break;

      case /header2/.test(className):
        break;

      case /quote/.test(className):
        if (hasParent(window.getSelection().focusNode, "blockquote")) {
          document.execCommand('formatBlock', false, 'p');
          document.execCommand('outdent');
        } else {
          document.execCommand('formatBlock', false, 'blockquote');
        }
        break;

      case /url/.test(className):
        break;

      default:
        // no default
    }

    triggerTextSelection();
  }

  function hasParent(node, nodeType) {
    while (node.parentNode) {
      if (node.nodeName.toLowerCase() === nodeType) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }

  function triggerTextSelection() {
      var selectedText = root.getSelection(),
          range,
          clientRectBounds;

      // The selection is collapsed, push the menu out of the way
      if (selectedText.isCollapsed) {
        setTextMenuPosition(-999, -999);
      } else {
        range = selectedText.getRangeAt(0);
        clientRectBounds = range.getBoundingClientRect();

        setTextMenuPosition(
          clientRectBounds.top - 5 + root.pageYOffset,
          (clientRectBounds.left + clientRectBounds.right) / 2
        );
      }

  };

  function setTextMenuPosition(top, left) {
    textMenu.style.top = top + "px";
    textMenu.style.left = left + "px";
  }

  root.grande = grande;
}).call(this);
