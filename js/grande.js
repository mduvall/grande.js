(function(w, d) {
  /*jshint multistr:true */
  var EDGE = -999;
  var IMAGE_URL_REGEX = /^https?:\/\/(.*)\.(jpg|png|gif|jpeg)(\?.*)?/i;
  var YOUTUBE_URL_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;

  var Grande = Grande || function (bindableNodes, userOpts) {

    var root = w,   // Root object, this is going to be the window for now
        document = d, // Safely store a document here for us to use
        editableNodes = bindableNodes || document.querySelectorAll(".g-body article"),
        editNode = bindableNodes[0], // TODO: cross el support for imageUpload
        isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
        options = {
          animate: true,
          placeholder: null,
          mode: "rich", // inline, rich, partial
          rtl: false,
          imagesFromUrls: false, // Convert images urls to <img>s. Must be "rich" mode.
          allowImages: false,
          // This will be called when a user select an image to insert into the article.
          // It should accept two params (filesList, insertImageCallback(imgurl)).
          // filesList is going to be the list of files the user selected,
          // and insertImageCallback needs to be called with the uploaded image url.
          // The callback needs to take care of uploading the image to a host.
          uploadCallback: null
        },
        textMenu,
        optionsNode,
        urlInput,
        previouslySelectedText,
        imageTooltip,
        imageInput,
        imageBound,

        init = function(nodes, opts) {
          options = extend(options, opts);

          attachToolbarTemplate();
          initPlaceholder();
          bindTextSelectionEvents();
          bindTextStylingEvents();
        },

        select = function() {
          triggerTextSelection();
        },

        tagClassMap = {
          "b": "bold",
          "i": "italic",
          "h1": "header1",
          "h2": "header2",
          "a": "url",
          "pre": "code",
          "blockquote": "quote"
        };


    function extend(destination, userOpts) {
      for (var property in userOpts) {
        destination[property] = userOpts[property];
      }
      return destination;
    }

    function initPlaceholder() {
      if (options.placeholder) {
        var p, node;

        for (i = 0, len = editableNodes.length; i < len; i++) {
          node = editableNodes[i];
          if (node[getTextProp(node)]) {
            continue;
          }

          addPlaceholder(node, options.placeholder);
          node.onblur = triggerContentBlur;
          node.onfocus = triggerContentFocus;
        }
      };
    }

    function addPlaceholder(el, text) {
      p = document.createElement("span");
      p.innerText = text;
      p.className = "g-placeholder";
      el.appendChild(p);
    }

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
                <button class='code'>&lt;&gt;</button> \
                <input class='url-input' type='text' placeholder='Paste or type a link'/> \
              </span> \
            </span> \
          </div>",
          imageTooltipTemplate = document.createElement("div"),
          toolbarContainer = document.createElement("div");

      toolbarContainer.className = "g-body";
      document.body.appendChild(toolbarContainer);

      imageTooltipTemplate.innerHTML = "<div class='pos-abs file-label'>Insert image</div> \
                                          <input class='file-hidden pos-abs' type='file' id='files' name='files[]' accept='image/*' multiple/>";
      imageTooltipTemplate.className = "image-tooltip hide";

      div.className = "text-menu hide";
      div.innerHTML = toolbarTemplate;

      if (document.querySelectorAll(".text-menu").length === 0) {
        toolbarContainer.appendChild(div);
        toolbarContainer.appendChild(imageTooltipTemplate);
      }

      imageInput = document.querySelectorAll(".file-label + input")[0];
      imageTooltip = document.querySelectorAll(".image-tooltip")[0];
      textMenu = document.querySelectorAll(".text-menu")[0];
      optionsNode = document.querySelectorAll(".text-menu .options")[0];
      urlInput = document.querySelectorAll(".text-menu .url-input")[0];
    }

    function bindTextSelectionEvents() {
      var i,
          len,
          node;

      // Handle window resize events
      root.onresize = triggerTextSelection;

      urlInput.onblur = triggerUrlBlur;
      urlInput.onkeydown = triggerUrlSet;

      for (i = 0, len = editableNodes.length; i < len; i++) {
        node = editableNodes[i];
        node.contentEditable = true;
        node.className = node.className + " g-editor";

        if (options.allowImages && options.uploadCallback) {
          imageTooltip.onmousedown = triggerImageUpload;
          imageInput.onchange = uploadImage;
          node.onmousemove = triggerOverlayStyling;
        }

        // Trigger on both mousedown and mouseup so that the click on the menu
        // feels more instantaneously active
        node.onmouseup = function(event) {
          setTimeout(function() {
            triggerTextSelection(event);
          }, 1);
        };
        node.onkeydown = preprocessKeyDown;
        node.onkeyup = function(event){
          var sel = window.getSelection();

          // FF will return sel.anchorNode to be the parentNode when the triggered keyCode is 13
          if (sel.anchorNode && sel.anchorNode.nodeName !== "ARTICLE") {
            triggerNodeAnalysis(event);

            if (sel.isCollapsed) {
              triggerTextParse(event);
            }
          }
        };
        node.onmousedown = triggerTextSelection;
      }
    }

    function triggerOverlayStyling(event) {
      toggleImageTooltip(event, event.target);
    }

    function triggerImageUpload(event) {
      // Cache the bound that was originally clicked on before the image upload
      var childrenNodes = editNode.children,
          editBounds = editNode.getBoundingClientRect();

      imageBound = getHorizontalBounds(childrenNodes, editBounds);
    }

    function uploadImage(event) {
      if (options.uploadCallback) {
        // Prepare the figure and progress bar elements.
        var figureEl = document.createElement("figure");
        var progressEl = document.createElement("p")
        progressEl.className = "g-progress-bar";
        var progressIndicatorEl = document.createElement("span");
        progressEl.appendChild(progressIndicatorEl);
        figureEl.appendChild(progressEl);
        editNode.insertBefore(figureEl, imageBound.bottomElement);

        options.uploadCallback(this.files,
          // Upload complete callback.
          function(imageSrc) {
            figureEl.innerHTML = "<img src=\"" + imageSrc + "\"/>";
          },
          // Upload progress event.
          function (progress) {
            progressIndicatorEl.style.width = progress + "%";
          });

        imageInput.innerHTML = imageInput.innerHTML;
        imageInput.onchange = uploadImage;
      }
    }

    function toggleImageTooltip(event, element) {
      var childrenNodes = element.children,
          editBounds = element.getBoundingClientRect(),
          bound = getHorizontalBounds(childrenNodes, editBounds);

      if (bound) {
        if (!options.rtl) {
          imageTooltip.style.left = (editBounds.left - 90 ) + "px";
        } else {
          imageTooltip.style.left = (editBounds.right + 90 ) + "px";
        }
        imageTooltip.style.top = (bound.top - 17) + "px";
      } else {
        imageTooltip.style.left = EDGE + "px";
        imageTooltip.style.top = EDGE + "px";
      }
    }

    function getHorizontalBounds(nodes, target) {
      var bounds = [],
          bound,
          i,
          len,
          preNode,
          postNode,
          bottomBound,
          topBound,
          coordY;

      // Compute top and bottom bounds for each child element
      for (i = 0, len = nodes.length - 1; i < len; i++) {
        preNode = nodes[i];
        postNode = nodes[i+1] || null;

        bottomBound = preNode.getBoundingClientRect().bottom - 5;
        topBound = postNode.getBoundingClientRect().top;

        bounds.push({
          top: topBound,
          bottom: bottomBound,
          topElement: preNode,
          bottomElement: postNode,
          index: i+1
        });
      }

      coordY = event.pageY - root.scrollY;

      // Find if there is a range to insert the image tooltip between two elements
      for (i = 0, len = bounds.length; i < len; i++) {
        bound = bounds[i];
        if (coordY < bound.top && coordY > bound.bottom) {
          return bound;
        }
      }

      // When no bounds is found return the first bound.
      return bounds[0];
    }

    function iterateTextMenuButtons(callback) {
      var textMenuButtons = document.querySelectorAll(".text-menu button"),
          i,
          len,
          node,
          fnCallback = function(n) {
            callback(n);
          };

      for (i = 0, len = textMenuButtons.length; i < len; i++) {
        node = textMenuButtons[i];

        fnCallback(node);
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

    function preprocessKeyDown(event) {
      var sel = window.getSelection(),
          parentParagraph = getParentWithTag(sel.anchorNode, "p"),
          parentPre = getParentWithTag(sel.anchorNode, "pre"),
          p,
          isHr;

      if (options.mode === "inline" && event.keyCode === 13) {
        event.preventDefault();
        return;
      }

      if (event.keyCode === 13 && parentParagraph) {
        prevSibling = parentParagraph.previousSibling;
        isHr = prevSibling && prevSibling.nodeName === "HR" &&
          !(parentParagraph.textContent.length ||
            parentParagraph.getElementsByTagName('img').length);

        // Stop enters from creating another <p> after a <hr> on enter
        if (isHr) {
          event.preventDefault();
        }
      }
      // When writing code, just insert a new line instead of a new pre element.
      else if (event.keyCode === 13 && parentPre) {
        document.execCommand("insertHtml", false, "\n");
        event.preventDefault();
        return false;
      }
    }

    function triggerNodeAnalysis(event) {
      var sel = window.getSelection(),
          anchorNode,
          parentParagraph;

      if (event.keyCode === 13) {

        // Enters should replace it's parent <div> with a <p>
        if (sel.anchorNode.nodeName === "DIV") {
          toggleFormatBlock("p");
        }

        // Replace figure elements on new line with a p and set focus on it.
        if (sel.anchorNode.nodeName === "FIGURE") {
          toggleFormatBlock("p");
          sel.anchorNode.parentNode.innerHTML = '<span><br/></span>';
          sel.anchorNode.childNodes[0].focus();
        }

        parentParagraph = getParentWithTag(sel.anchorNode, "p");

        if (parentParagraph) {
          insertHorizontalRule(parentParagraph);
        }
      }
    }

    function insertHorizontalRule(parentParagraph) {
      var prevSibling,
          prevPrevSibling,
          hr;

      prevSibling = parentParagraph.previousSibling;
      prevPrevSibling = prevSibling;

      while (prevPrevSibling) {
        if (prevPrevSibling.nodeType != Node.TEXT_NODE) {
          break;
        }

        prevPrevSibling = prevPrevSibling.previousSibling;
      }

      if (prevSibling.nodeName === "P" &&
          !prevSibling.textContent.length &&
          !prevSibling.getElementsByTagName('img').length &&
          prevPrevSibling.nodeName !== "HR") {
        hr = document.createElement("hr");
        hr.contentEditable = false;
        parentParagraph.parentNode.replaceChild(hr, prevSibling);
      }
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

    function insertImageOnSelection(sel, textProp) {
      var path = sel.anchorNode[textProp];
      sel.anchorNode[textProp] = '';
      var html = "<figure><img src=\"" + path + "\"/></figure>";
      document.execCommand("insertHTML", false, html);
      return getParentWithTag(sel.anchorNode, 'figure');
    }

    function insertVideoOnSelection(sel, textProp) {
      var path = sel.anchorNode[textProp];
      sel.anchorNode[textProp] = '';
      var html = "<figure><iframe width='560' height='315' src='http://www.youtube.com/embed/" + path + "'></iframe></figure>";
      document.execCommand("insertHTML", false, html);
      return getParentWithTag(sel.anchorNode, 'figure');
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

      if (subject.match(/^[-*]\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
        insertedNode = insertListOnSelection(sel, textProp, "ul");
      }

      if (subject.match(/^(1|١)\.\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
        insertedNode = insertListOnSelection(sel, textProp, "ol");
      }

      if (options.mode === "rich" && options.imagesFromUrls && subject.match(IMAGE_URL_REGEX)) {
        insertedNode = insertImageOnSelection(sel, textProp);
      }

      if (subject.match(YOUTUBE_URL_REGEX)) {
        insertedNode = insertVideoOnSelection(sel, textProp);
      }      

      unwrap = insertedNode &&
              ["ul", "ol"].indexOf(insertedNode.nodeName.toLocaleLowerCase()) >= 0 &&
              ["p", "div"].indexOf(insertedNode.parentNode.nodeName.toLocaleLowerCase()) >= 0;

      if (unwrap) {
        node = sel.anchorNode;
        parent = insertedNode.parentNode;
        parent.parentNode.insertBefore(insertedNode, parent);
        parent.parentNode.removeChild(parent);
        moveCursorToBeginningOfSelection(sel, node);
      }
    }

    function moveCursorToBeginningOfSelection(selection, node) {
      range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, 0);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    function triggerTextStyling(node) {
      var className = node.className,
          sel = window.getSelection(),
          selNode = sel.anchorNode,
          tagClass,
          reTag;

      for (var tag in tagClassMap) {
        tagClass = tagClassMap[tag];
        reTag = new RegExp(tagClass);

        if (reTag.test(className)) {
          switch(tag) {
            case "b":
              if (selNode && !hasParentWithTag(selNode, "h1") && !hasParentWithTag(selNode, "h2")) {
                document.execCommand(tagClass, false);
              }
              return;
            case "i":
              document.execCommand(tagClass, false);
              return;

            case "h1":
            case "h2":
            case "h3":
            case "blockquote":
            case "pre":
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

      if (!url.match("^(http://|https://|mailto:)")) {
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
      if (node === null) {
        return;
      }

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

    function triggerTextSelection(e) {
      var selectedText = root.getSelection(),
          range,
          clientRectBounds,
          target = e.target || e.srcElement;

      // The selected text is not editable
      if (!target.isContentEditable || options.mode !== "rich") {
        reloadMenuState();
        return;
      }

      // The selected text is collapsed, push the menu out of the way
      if (selectedText.isCollapsed) {
        setTextMenuPosition(EDGE, EDGE);
        textMenu.className = "text-menu hide";
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
      // RTL Seems to have a problem with calculating the bounding client.
      if (options.rtl) {
        left += 200;
      }
      textMenu.style.top = top + "px";
      textMenu.style.left = left + "px";

      if (options.animate) {
        if (top === EDGE) {
          textMenu.className = "text-menu hide";
        } else {
          textMenu.className = "text-menu active";
        }
      }
    }

    function triggerContentFocus(e) {
      var el = e.target, wasPlaceholder;
      var p = el.getElementsByClassName('g-placeholder');
      for (var i=0; i < p.length; i++) {
        el.removeChild(p[i]);
        wasPlaceholder = true;
      }

      // A hack to get the element to focus.
      if (wasPlaceholder) {
        var range = document.createRange();
        range.selectNodeContents(this);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
     }

    function triggerContentBlur(e) {
      var el = e.target;
      var content = el[getTextProp(el)];
      if (!content.trim()) {
        addPlaceholder(el, options.placeholder);
      }
      // Unless the options are in url-mode. Hide the menu.
      if (optionsNode.className.search("url-mode") === -1) {
        setTextMenuPosition(EDGE, EDGE);
        textMenu.className = "text-menu hide";
      }
    }

    init(bindableNodes, userOpts);
  }

  // Exports and modularity
  if (typeof module !== 'undefined' && module.exports) {
      module.exports = Grande;
  }

  if (typeof ender === 'undefined') {
      this.Grande = Grande;
  }

  if (typeof define === "function" && define.amd) {
      define('Grande', [], function () {
          return Grande;
      });
  }

}).call(this, window, document);
