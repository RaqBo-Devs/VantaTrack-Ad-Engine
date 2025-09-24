(function() {
  'use strict';

  var VantaAdTag = {
    version: '1.0.0',
    
    // Configuration
    config: {
      baseUrl: window.location.protocol + '//' + window.location.host,
      endpoint: '/ad/v1/serve'
    },

    // Create iframe for ad placement
    createAdFrame: function(placementKey, container) {
      var iframe = document.createElement('iframe');
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.width = '728px';
      iframe.style.height = '90px';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('data-placement', placementKey);
      
      var timestamp = Date.now();
      var random = Math.floor(Math.random() * 1000000);
      
      var adUrl = this.config.baseUrl + this.config.endpoint + 
        '?placement=' + encodeURIComponent(placementKey) +
        '&page=' + encodeURIComponent(window.location.href) +
        '&ref=' + encodeURIComponent(document.referrer || '') +
        '&ts=' + timestamp +
        '&r=' + random +
        '&ua=' + encodeURIComponent(navigator.userAgent) +
        '&viewport=' + encodeURIComponent(window.innerWidth + 'x' + window.innerHeight);
      
      iframe.src = adUrl;
      
      // Clear loading message and show iframe
      container.innerHTML = '';
      container.appendChild(iframe);
      
      // Dimensions already set above
      
      // Listen for resize messages from ad content
      window.addEventListener('message', function(event) {
        if (event.source === iframe.contentWindow && event.data.type === 'vanta-ad-resize') {
          iframe.style.height = event.data.height + 'px';
        }
      });
      
      return iframe;
    },

    // Initialize ad placement
    init: function(placementKey, containerId) {
      var container = document.getElementById(containerId);
      if (!container) {
        console.warn('VantaTrack: Container not found for placement ' + placementKey);
        return;
      }
      
      // Add loading indicator
      container.innerHTML = '<div style="text-align:center;color:#999;font-size:12px;padding:10px;">Ad Loading...</div>';
      
      try {
        this.createAdFrame(placementKey, container);
      } catch(e) {
        console.error('VantaTrack: Error loading ad', e);
        container.innerHTML = '';
      }
    },

    // Batch initialize multiple placements
    initMultiple: function(placements) {
      for (var i = 0; i < placements.length; i++) {
        var placement = placements[i];
        this.init(placement.key, placement.containerId);
      }
    }
  };

  // Auto-init placements with data attributes
  function autoInit() {
    var elements = document.querySelectorAll('[data-vanta-placement]');
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      var placementKey = element.getAttribute('data-vanta-placement');
      if (placementKey && element.id) {
        VantaAdTag.init(placementKey, element.id);
      }
    }
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Make VantaAdTag globally available
  window.VantaAdTag = VantaAdTag;

})();