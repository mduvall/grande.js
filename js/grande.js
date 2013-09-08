(function() {
  var root = this,   // Root object, this is going to be the window for now
      document = this.document, // Safely store a document here for us to use
      div = document.createElement("div"),
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

  // If user hasn't provided a .text-menu, insert one into the DOM
  if (!document.querySelector(".text-menu"))
    document.body.appendChild(div);


  var editableNodes = document.querySelectorAll(".g-body article"),
      textMenu = document.querySelectorAll(".g-body .text-menu")[0],
      optionsNode = document.querySelectorAll(".g-body .text-menu .options")[0],
      urlInput = document.querySelectorAll(".g-body .text-menu .url-input")[0],
      isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,

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
    
    document.onkeyup = function(event){
      var sel = window.getSelection();
      
      // FF will return sel.anchorNode to be the parentNode when the triggered keyCode is 13
      if (sel.anchorNode && sel.anchorNode.nodeName !== "ARTICLE") {
        triggerNodeAnalysis(event);
        
        if (sel.isCollapsed) triggerTextParse(event);
      }
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
          if (getParentOfType(focusNode, tag)) {
            node.className = tagClass + " active";
          } else {
            node.className = tagClass;
          }

          break;
        }
      }
    });
  }

  function triggerNodeAnalysis(event) {
    console.log('analysis');
    var sel = window.getSelection(),
        anchorNode,
        parentP,
        hr;
    
    if (event.keyCode === 13) {
      parentP = getParentOfType(sel.anchorNode, 'p');
      	
      if (sel.anchorNode.nodeName.toLowerCase() === 'p' || parentP) {
        if (parentP.previousSibling.nodeName.toLowerCase() === 'p' && !parentP.previousSibling.textContent.length) {
          hr = document.createElement('hr');
          parentP.parentNode.replaceChild(hr, parentP.previousSibling);
        }
      }
    }
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

    if (sel.anchorNode.nodeType === Node.TEXT_NODE) {
      textProp = "data";
    } else if (isFirefox) {
      textProp = "textContent";
    } else {
      textProp = "innerText";
    }

    subject = sel.anchorNode[textProp];

    if (subject.match(/^-\s/) && sel.anchorNode.parentNode.nodeName !== 'LI') {
      document.execCommand('insertUnorderedList');
      sel.anchorNode[textProp] = sel.anchorNode[textProp].substring(2);

      insertedNode = getParentOfType(sel.anchorNode, 'ul');
    }

    if (subject.match(/^1\.\s/) && sel.anchorNode.parentNode.nodeName !== 'LI') {
      document.execCommand('insertOrderedList');
      sel.anchorNode[textProp] = sel.anchorNode[textProp].substring(3);

      insertedNode = getParentOfType(sel.anchorNode, 'ol');
    }

    unwrap = insertedNode &&
            ['ul', 'ol'].indexOf(insertedNode.nodeName.toLocaleLowerCase()) >= 0 &&
            ['p', 'div'].indexOf(insertedNode.parentNode.nodeName.toLocaleLowerCase()) >= 0;

    if (unwrap) {
      node = sel.anchorNode;
      parent = insertedNode.parentNode;
      insertedNode.parentNode.parentNode.insertBefore(insertedNode, insertedNode.parentNode);
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
    if (getParentOfType(getFocusNode(), tag)) {
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

  function getParentOfType(node, nodeType){
    while (node.parentNode) {
      if (node.nodeName.toLowerCase() === nodeType) {
        return node;
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
