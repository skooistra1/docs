/*!

Documentation middleware.
Created by Zach Supalla.
(c) 2014 Spark Labs, Inc. MIT licensed.

*/

(function($) {
  var exports = this;

  /**
   * Basic Docs module.
   */

  var Docs = exports.Docs = {};

  Docs.transform = function() {
    this.tagImages();
    this.buttonize();
    this.prettifyCode();
  };

  /**
   * Tags paragraphs that include images.
   */

  Docs.tagImages = function() {
    $('.content').find('p:has(img)').each(function() {
      var $el = $(this);
      $el.addClass('img');
    });
  };

  /**
   * Changes "button >" text to buttons.
   */

  Docs.buttonize = function() {
    $('.content').find('a').each(function() {
      var $a = $(this);

      var m = $a.text().match(/^(.*) >$/);
      if (m) $a.text(m[1]).addClass('button');
    });
  };

  /**
   * Make code prettier
   */

  Docs.prettifyCode = function() {
    $('.content').find('pre code').each(function() {
      $(this).addClass("prettyprint");
    });
  };


  Docs.rememberDevices = function() {
    if(typeof(Storage) !== "undefined") {
      var currentPath = window.location.pathname;
      if(currentPath.indexOf("photon") > -1) {
        localStorage.setItem("lastDevice", "photon");
      } else if (currentPath.indexOf("core") > -1) {
        localStorage.setItem("lastDevice", "core");
      }
    }
  };


  Docs.handleH3ClassChanges = function(elementId, noH2s, enter) {
    var dataSelector = noH2s ? 'data-nav' : 'data-secondary-nav';
    var $correspondingNavElement = $('li['+dataSelector+'="'+elementId+ '"]');
    $('li['+dataSelector+']').removeClass('active');
    $correspondingNavElement.addClass('active');
    if(!noH2s && enter) {
      var $parentli = $correspondingNavElement.parent().prev('li[data-nav]');
      var $nextli = $correspondingNavElement.parent().next('li[data-nav]');
      if(!$parentli.hasClass('active')) {
        $parentli.addClass('active')
          .find('.toggle-secondary-toc').removeClass('ion-arrow-right-b').addClass('ion-arrow-down-b');
        $nextli.removeClass('active')
          .find('.toggle-secondary-toc').removeClass('ion-arrow-down-b').addClass('ion-arrow-right-b');
        $correspondingNavElement.parent().show();
        $nextli.next('.secondary-in-page-toc').hide();
      }
    }
  };

  Docs.createH3Waypoints = function(h3s, noH2s) {
        h3s.each(function() {
          var element = $(this)[0];
          setTimeout(function() {
            var waypoint = new Waypoint.Inview({
              element: element,
              exit: function(direction) {
                if(direction === 'down') {
                  var elementId = this.element.id;
                  Docs.handleH3ClassChanges(elementId, noH2s);
                }
              },
              enter: function(direction) {
                if(direction === 'up') {
                  var elementId = this.element.id;
                  Docs.handleH3ClassChanges(elementId, noH2s, true);
                }
              },
              context: $('.content-inner')[0],
              continuous: false
            });
          }, 0);
       });
  };

  Docs.scrollToElement = function(element) {
    var $element = $(element);
    if($element.length === 1) {
      var position = $(element).position().top;
      $('.content-inner').scrollTop(position);
    }
  };

  Docs.scrollToInternalLinks = function() {
    var $internalLinks = $('a[href^="#"]');
    $internalLinks.click(function(e) {
      e.preventDefault();
      var id = $(this).attr('href');
      Docs.scrollToElement(id);
      window.location.hash = id;
    });
  };

  Docs.scrollToHashOnLoad = function() {
    var hash = window.location.hash;
    if (hash !== '' && window.location.pathname !== '/') {
      setTimeout(function() {
        Docs.scrollToElement(hash);
      }, 1000);
    }
  };

  Docs.handleClassChanges = function(elementId, $h2, h3WaypointsCreated) {
    // This is the menu li that corresponds to the h2 that was scrolled to
    var $correspondingNavElement = $('li[data-nav="'+ elementId+'"]');
    // Remove active class
    $('ul.in-page-toc li[data-nav]').removeClass('active')
       // Show the secondary nav as collapsed
      .find('.toggle-secondary-toc').removeClass('ion-arrow-down-b').addClass('ion-arrow-right-b');
    // Make the current nav element active
    $correspondingNavElement.addClass('active')
       // Show the secondary nav as expanded
      .find('.toggle-secondary-toc').removeClass('ion-arrow-right-b').addClass(' ion-arrow-down-b');

    // Hide all the other secondary in page tocs
    $('ul.secondary-in-page-toc').hide();
    // Show the secondary in page toc for this section
    var $secondaryNav = $correspondingNavElement.next('.secondary-in-page-toc');
    if($secondaryNav.length > 0) {
      $secondaryNav.show();
    }
  };

  Docs.createScrollSpies = function() {
    var $h2s = $('.content h2');
    if($h2s.length === 0) {
      Docs.createH3Waypoints($('.content h3'), true);
    } else {
      $h2s.each(function() {
        var h3WaypointsCreated = false;
        var waypoint = new Waypoint.Inview({
          element: $(this)[0],
          exit: function(direction) {
            var $h2 = $(this.element);
            if(direction === 'down') {
              var elementId = this.element.id;
              Docs.handleClassChanges(elementId, $h2, h3WaypointsCreated);
              // Create the waypoints for h3s intelligently
              var $nextH3s = $h2.nextUntil('h2', 'h3');
              if(!h3WaypointsCreated) {
                Docs.createH3Waypoints($nextH3s);
                h3WaypointsCreated = true;
              }
            }
          },
          enter: function(direction) {
            var $h2 = $(this.element);
            if(direction === 'up') {
              var elementId = this.element.id;
              Docs.handleClassChanges(elementId, $h2, h3WaypointsCreated);
              // Create the waypoints for h3s intelligently
              var $nextH3s = $h2.nextUntil('h2', 'h3');
              if(!h3WaypointsCreated) {
                Docs.createH3Waypoints($nextH3s);
                h3WaypointsCreated = true;
              }
            }
          },
          context: $('.content-inner')[0]
        });
      });
    }
    // Scroll to the current hash if there is one
    Docs.scrollToHashOnLoad();
  };

  Docs.watchToggleInPageNav = function() {
    $('li.top-level.active').click(function() {
      $('ul.in-page-toc').toggleClass('show hide');
      $(this).find('#toggle-in-page-nav').toggleClass("ion-plus ion-minus");
    });
  };
  Docs.watchToggleSecondaryInPageNav = function() {
    $('.toggle-secondary-toc').click(function() {
      var $this = $(this);
      var $parent = $this.parent();
      if($this.hasClass('ion-arrow-down-b')) {
        $this.removeClass('ion-arrow-down-b').addClass('ion-arrow-right-b');
        $parent.next('.secondary-in-page-toc').hide();
      } else {
        $this.removeClass('ion-arrow-right-b').addClass('ion-arrow-down-b');
        $parent.next('.secondary-in-page-toc').show();
      }
    });
  };

  Docs.checkIfGuideScrollbar = function() {
    var $contentInner = $('.content-inner')[0];
    if($contentInner.scrollHeight > $contentInner.clientHeight) {
      $('.arrow.next-arrow').css('margin-right', '15px');
    }
  };

  Docs._removeEmptyTokens = function removeEmptyTokens(token) {
    if (token.length > 0) {return token};
  };

  Docs.resultsAdded = 0;

  Docs.buildSearch = function() {
    lunr.Pipeline.registerFunction(Docs._removeEmptyTokens, 'removeEmptyTokens');

    $.getJSON('/search-index.json', function(data) {
      var store = data.store;
      var idx = lunr.Index.load(data.index);
      $('input.search-box').keyup(function() {
        var searchQuery = this.value;
        Docs.emptyResults();
        if(searchQuery === '' || searchQuery.length < 3) {
          $('.search-results').hide();
        }
        else {
          $('.search-results').show();
          var results = idx.search(searchQuery);
          Docs.buildSearchResults(results, store);
        }
      });
    });
  };
  Docs.emptyResults = function() {
    $('.search-results ul.results').empty();
    Docs.resultsAdded = 0;
  };

  Docs.titleize = function(string) {
    var stringNoDashes = string.replace(/-/g, ' ');
    var stringToTitleCase = stringNoDashes.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    return stringToTitleCase;
  }

  Docs.buildSearchResults = function(results, store) {
    var htmlToAppend = '';

    results.forEach(function(r) {
      /*var resultInfo = store[r.ref];

      r.link = r.ref;
      r.title = resultInfo.title;
      r.device = resultInfo.device;
      r.collection = Docs.titleize(resultInfo.collection);
      r.pageTitle = resultInfo.pageTitle;
      r.collectionClass = resultInfo.collection;

      if(counter < 5) {
        fiveResults.push(r);
        counter++;
      }*/


      var $results = $('.results li');
      var resultCount = $results.length;


      if( Docs.resultsAdded < 5 && r.ref) {

        var resultInfo = store[r.ref];
        var link = r.ref;
        var title = resultInfo.title;
        var collection = Docs.titleize(resultInfo.collection);
        var collectionRaw = resultInfo.collection;
        var pageTitle = resultInfo.pageTitle;
        var device = resultInfo.device ? Docs.titleize(resultInfo.device) : null;

        var li;

        if(device) {
          li = '<a href="/' + link + '"><li>' +
                    '<div class="left-result">' +
                      '<span class="title">' + title + '</span>' +
                      '<span class="page-title">' + pageTitle + '</span>' +
                      '<span class="device"><i class="im-devices-icon"></i>' + '<span>' + device + '</span>' + '</span>' +
                    '</div>' +
                    '<span class="tag ' + collectionRaw + '">'+collection +'</span>' +
                  '</li></a>';
        } else {
          li = '<a href="/' + link + '"><li>' +
                    '<div class="left-result">' +
                      '<span class="title">' + title + '</span>' +
                      '<span class="page-title">' + pageTitle + '</span>' +
                    '</div>' +
                    '<span class="tag ' + collectionRaw + '">'+collection +'</span>' +
                  '</li></a>';
        }

        htmlToAppend += li;
        Docs.resultsAdded++;
      }
    });

    $('.search-results ul').append(htmlToAppend);
  };

  // Ok, then let's do it!
  Docs.rememberDevices();
  Docs.transform();
  Docs.createScrollSpies();
  Docs.scrollToInternalLinks();
  Docs.watchToggleInPageNav();
  Docs.watchToggleSecondaryInPageNav();
  Docs.checkIfGuideScrollbar();
  Docs.buildSearch();
  prettyPrint();

})(jQuery);
