(function() {
  var root = this,   // Root object, this is going to be the window for now
      document = this.document, // Safely store a document here for us to use
      editableNodes = document.querySelectorAll(".g-body header, .g-body article"),
      textMenu = document.querySelectorAll(".g-body .text-menu")[0],

      grande = {
        bind: function() {
            bindTextSelectionEvents();
        },
      };

  function bindTextSelectionEvents() {
    var i,
        len,
        node;

    for (i = 0, len = editableNodes.length; i < len; i++) {
      node = editableNodes[i];

      node.onmousedown = node.onkeyup = node.onmouseup = function(event) {
        triggerTextSelection();
      };
    }
  };

  function triggerTextSelection() {
      var selectedText = root.getSelection(),
          range,
          clientRectBounds;

      // The selection is collapsed, push the menu out of the way
      if (selectedText.isCollapsed) {
        console.log('setting collpased stat');
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
