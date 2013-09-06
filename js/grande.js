(function() {
  var root = this,   // Root object, this is going to be the window for now
      document = this.document, // Safely store a document here for us to use
      editableNodes = document.querySelectorAll(".g-body article"),
      isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
      textMenu,
      optionsNode,
      urlInput,
      previouslySelectedText,

      grande = {
        bind: function() {
          attachToolbarTemplate();
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

  function attachToolbarTemplate() {
    var div = document.createElement("div"),
        toolbarTemplate = "<div class='options'> \
          <span class='no-overflow'> \
            <span class='ui-inputs'> \
              <button class='bold'>B</button> \
              <button class='italic'>i</button> \
              <button class='header1'>h1</button> \
              <button class='header2'>h2</button> \
              <button class='quote'>&rdquo;</button> \
              <button class='url useicons'>&#xe001;</button> \
              <input class='url-input' type='text' placeholder='Paste or type a link'/> \
            </span> \
          </span> \
        </div>";

    div.className = "text-menu hide";
    div.innerHTML = toolbarTemplate;

    if (document.querySelectorAll(".text-menu").length === 0) {
      document.body.appendChild(div);
    }

    textMenu = document.querySelectorAll(".text-menu")[0];
    optionsNode = document.querySelectorAll(".text-menu .options")[0];
    urlInput = document.querySelectorAll(".text-menu .url-input")[0];
  }

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
    document.onkeyup = triggerTextParse;

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
    var textMenuButtons = document.querySelectorAll(".text-menu button"),
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

  function getTextProp(el) {
    var textProp;

    if (el.nodeType === Node.TEXT_NODE) {
      textProp = "data";
    } else if (isFirefox) {
      textProp = "textContent";
    } else {
      textProp = "innerText";
    }

    return textProp;
  }

  function insertListOnSelection(sel, textProp, listType) {
    var execListCommand = listType === "ol" ? "insertOrderedList" : "insertUnorderedList",
        nodeOffset = listType === "ol" ? 3 : 2;

    document.execCommand(execListCommand);
    sel.anchorNode[textProp] = sel.anchorNode[textProp].substring(nodeOffset);

    return getParentWithTag(sel.anchorNode, listType);
  }

  function triggerTextParse(event) {
    var sel = window.getSelection(),
        textProp,
        subject,
        insertedNode,
        unwrap,
        node,
        parent,
        range;

    // FF will return sel.anchorNode to be the parentNode when the triggered keyCode is 13
    if (!sel.isCollapsed || !sel.anchorNode || sel.anchorNode.nodeName === "ARTICLE") {
      return;
    }

    textProp = getTextProp(sel.anchorNode);
    subject = sel.anchorNode[textProp];

    if (subject.match(/^-\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
      insertedNode = insertListOnSelection(sel, textProp, "ul");
    }

    if (subject.match(/^1\.\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
      insertedNode = insertListOnSelection(sel, textProp, "ol");
    }

    unwrap = insertedNode &&
            ["ul", "ol"].indexOf(insertedNode.nodeName.toLocaleLowerCase()) >= 0 &&
            ["p", "div"].indexOf(insertedNode.parentNode.nodeName.toLocaleLowerCase()) >= 0;

    if (unwrap) {
      node = sel.anchorNode;
      parent = insertedNode.parentNode;
      parent.parentNode.insertBefore(insertedNode, parent);
      parent.parentNode.removeChild(parent);

      range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, 0);
      sel.removeAllRanges();
      sel.addRange(range);
    }
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

  function getParent(node, condition, returnCallback) {
    while (node.parentNode) {
      if (condition(node)) {
        return returnCallback(node);
      }

      node = node.parentNode;
    }
  }

  function getParentWithTag(node, nodeType) {
    var checkNodeType = function(node) { return node.nodeName.toLowerCase() === nodeType; },
        returnNode = function(node) { return node; };

    return getParent(node, checkNodeType, returnNode);
  }

  function hasParentWithTag(node, nodeType) {
    return !!getParentWithTag(node, nodeType);
  }

  function getParentHref(node) {
    var checkHref = function(node) { return typeof node.href !== "undefined"; },
        returnHref = function(node) { return node.href; };

    return getParent(node, checkHref, returnHref);
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
