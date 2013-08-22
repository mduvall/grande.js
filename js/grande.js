(function() {
  var root = this,   // Root object, this is going to be the window for now
      document = this.document, // Safely store a document here for us to use
      editableNodes = document.querySelectorAll(".g-body article"),
      textMenu = document.querySelectorAll(".g-body .text-menu")[0],
      optionsNode = document.querySelectorAll(".g-body .text-menu .options")[0],
      urlInput = document.querySelectorAll(".g-body .text-menu .url-input")[0],
      previouslySelectedText,

      grande = {
        bind: function() {
          bindTextSelectionEvents();
          bindTextStylingEvents();
        },
        select: function() {
          triggerTextSelection();
        }
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

    urlInput.onblur = triggerUrlBlur;
    urlInput.onkeydown = triggerUrlSet;

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

  function getFocusNode() {
    return root.getSelection().focusNode;
  }

  function reloadMenuState() {
    var className;

    iterateTextMenuButtons(function(node) {
      className = node.className;
      var focusNode = getFocusNode();

      switch (true) {
        case /bold/.test(className):
          // TODO: This is a funky case where contenteditable will hack the font-weight
          // instead...need to look out for that as well
          if (hasParentWithTag(focusNode, "b")) {
            node.className = "bold active";
          } else {
            node.className = "bold";
          }
          break;

        case /italic/.test(className):
          if (hasParentWithTag(focusNode, "i")) {
            node.className = "italic active";
          } else {
            node.className = "italic";
          }
          break;

        case /header1/.test(className):
          if (hasParentWithTag(focusNode, "h1")) {
            node.className = "header1 active";
          } else {
            node.className = "header1";
          }
          break;

        case /header2/.test(className):
          if (hasParentWithTag(focusNode, "h2")) {
            node.className = "header2 active";
          } else {
            node.className = "header2";
          }
          break;

        case /quote/.test(className):
          if (hasParentWithTag(focusNode, "blockquote")) {
            node.className = "quote active";
          } else {
            node.className = "quote";
          }
          break;

        case /url/.test(className):
          if (hasParentWithTag(focusNode, "a")) {
            node.className = "url active";
          } else {
            node.className = "url";
          }
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
        toggleUrlInput();
        optionsNode.className = "options url-mode";
        break;

      default:
        // no default
    }

    triggerTextSelection();
  }

  function triggerUrlBlur(event) {
    var url = urlInput.value;

    optionsNode.className = "options";
    window.getSelection().addRange(previouslySelectedText);

    document.execCommand("unlink", false);

    if (url === "") {
      return false;
    }

    if (!url.match("^(http|https)://")) {
      url = "http://" + url;
    }

    document.execCommand("createLink", false, url);

    urlInput.value = "";
  }

  function triggerUrlSet(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      event.stopPropagation();

      urlInput.blur();
    }
  }

  function toggleFormatBlock(tag) {
    if (hasParentWithTag(getFocusNode(), tag)) {
      document.execCommand("formatBlock", false, "p");
      document.execCommand("outdent");
    } else {
      document.execCommand("formatBlock", false, tag);
    }
  }

  function toggleUrlInput() {
    setTimeout(function() {
      var url = getParentHref(getFocusNode());

      if (typeof url !== "undefined") {
        urlInput.value = url;
      } else {
        document.execCommand("createLink", false, "/");
      }

      previouslySelectedText = window.getSelection().getRangeAt(0);

      urlInput.focus();
    }, 150);
  }

  function hasParentWithTag(node, nodeType) {
    while (node.parentNode) {
      if (node.nodeName.toLowerCase() === nodeType) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }

  function getParentHref(node) {
    while (node.parentNode) {
      if (typeof node.href !== "undefined") {
        return node.href;
      }

      node = node.parentNode;
    }
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
