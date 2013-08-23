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
      },

      tagClassMap = {
        "b": "bold",
        "i": "italic",
        "h1": "header1",
        "h2": "header2",
        "a": "url",
        "blockquote": "quote"
      };

  function bindTextSelectionEvents() {
    var i,
        len,
        node;

    // Trigger on both mousedown and mouseup so that the click on the menu
    // feels more instantaneously active
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
    var className,
        focusNode = getFocusNode(),
        tagClass,
        reTag;

    iterateTextMenuButtons(function(node) {
      className = node.className;

      for (var tag in tagClassMap) {
        tagClass = tagClassMap[tag];
        reTag = new RegExp(tagClass);

        if (reTag.test(className)) {
          if (hasParentWithTag(focusNode, tag)) {
            node.className = tagClass + " active";
          } else {
            node.className = tagClass;
          }

          break;
        }
      }
    });
  }

  function triggerTextStyling(node) {
    var className = node.className,
        tagClass,
        reTag;

    for (var tag in tagClassMap) {
      tagClass = tagClassMap[tag];
      reTag = new RegExp(tagClass);

      if (reTag.test(className)) {
        switch(tag) {
          case "b":
          case "i":
            document.execCommand(tagClass, false);
            return;

          case "h1":
          case "h2":
          case "h3":
          case "blockquote":
            toggleFormatBlock(tag);
            return;

          case "a":
            toggleUrlInput();
            optionsNode.className = "options url-mode";
            return;
        }
      }
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
