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

      node.onmousedown = function(event) {
        triggerTextSelection();
      };

      node.onkeyup = function(event) {
        triggerTextSelection();
      };

      node.onmouseup = function(event) {
        triggerTextSelection();
      }
    }
  };

  function triggerTextSelection() {
      var selectedText = root.getSelection(),
          range,
          clientRectBounds;

      if (selectedText.isCollapsed) {
        return;
      }

      range = selectedText.getRangeAt(0);
      clientRectBounds = range.getBoundingClientRect();

      textMenu.style.top = clientRectBounds.top - 5 + root.pageYOffset + "px";
      textMenu.style.left = (clientRectBounds.left + clientRectBounds.right) / 2 + "px";

      console.log(textMenu);
  };

  root.grande = grande;
}).call(this);
