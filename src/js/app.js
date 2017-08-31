//import 'svelte/ssr/register'
import xr from 'xr'
import Handlebars from 'handlebars/dist/handlebars'
import Scrolling from 'scrolling';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';
import { groupBy } from './libs/arrayObjectUtils.js'
import { share } from './libs/share.js';

import mainTemplate from '../templates/mainList.html'
import gridPicTemplate from '../templates/gridPic.html'
import detailItemTemplate from '../templates/detailItem.html'
import gridThumbTemplate from '../templates/thumbPic.html'
import thumbsTemplate from '../templates/thumbsGallery.html'

var shareFn = share('Grenfell Tower', 'https://gu.com/p/72vvx');

let headerVisible = true;

let globalLevel = 23; // Index sets initial view to top of tower

var resizeTimeout = false;

var scrollTimeout = false;


 console.log(throttle)

function isMobile() {
    var dummy = document.getElementById("gv-mobile-dummy");
    if (getStyle(dummy) == 'block') {
        return true;
    } else {
        return false;
    } 
}

function getStyle (element) {
    return element.currentStyle ? element.currentStyle.display :
    getComputedStyle(element, null).display;
}

xr.get('https://interactive.guim.co.uk/docsdata-test/1K896qTOpgJQhG2IfGAChZ1WZjQAYn7-i869tA5cKaVU.json').then((resp) => {
    var data = formatData(resp.data.sheets.people);
    var compiledHTML = compileHTML(data);
    document.querySelector(".gv-right-view").innerHTML = compiledHTML;
    addListeners();
    updatePageDate();
    upDatePageView(data);
});


function formatData(dataIn) {

    var newObj = {};

    dataIn.map((obj) => {
        if (!obj.floor) { obj.floor = "unknown"; }
        if (!obj.age) { obj.age = "unknown"; }
        if (!obj.status) { obj.status = "unknown"; }

        obj.formatName = obj.name.split(",")[0];
        obj.sortName = obj.family_name + obj.formatName;
    })

    let floorArr = groupBy(dataIn, 'floor');

    floorArr = sortByKeys(floorArr);

    floorArr.map((obj) => {
        obj.count = obj.objArr.length;
    });

    newObj.floorSections = floorArr;

    return newObj;
}


function compileHTML(dataIn) {

    Handlebars.registerHelper('html_decoder', function(text) {
        var str = unescape(text).replace(/&amp;/g, '&');
        return str;
    });

    Handlebars.registerPartial({
        'gridPic': gridPicTemplate,
        'detailItem': detailItemTemplate
    });

    var content = Handlebars.compile(
        mainTemplate, {
            compat: true
        }
    );

    var newHTML = content(dataIn);

    return newHTML

}

function upDatePageView(data) {

    data.floorSections.map((obj) => {
        if (!isNaN(obj.sortOn)) {
            var newThumbGallery = addThumbGallery(obj);
            // console.log( obj.sortOn-1, document.getElementById("thumbs-holder-"+(obj.sortOn-1)) )
            document.getElementById("thumbs-holder-" + (obj.sortOn - 1)).innerHTML = newThumbGallery;

            //console.log(document.querySelectorAll('.gv-open-overlay-btn'));
        }
    })


    document.querySelectorAll('.gv-open-overlay-btn').forEach(btnEl => {
        btnEl.addEventListener('click', function() { openRightView(btnEl.getAttribute('data-level')) });
        // var level = btnEl.getAttribute('data-level');
        // btnEl.addEventListener('click',() => levelFn(level));
    });


    // [].slice.apply(document.querySelectorAll('.gv-open-overlay-btn')).forEach(shareEl => {
    //     console.log(btn)
    // });


}

function levelFn(n) {
    globalLevel = n;
    console.log(globalLevel, "---", n)
        //updateLevelView(globalLevel)
}


function addThumbGallery(dataIn) {
    Handlebars.registerPartial({
        'gridThumb': gridThumbTemplate
    });

    var content = Handlebars.compile(
        thumbsTemplate, {
            compat: true
        }
    );
    var newHTML = content(dataIn);
    return newHTML
}

function addListeners() {
    [].slice.apply(document.querySelectorAll('.gv-share-container button')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click', () => shareFn(network));
    });

    document.querySelector('.close-overlay-btn').addEventListener('click', hideRightView);  
    document.querySelector('.gv-continue-button').addEventListener('click', function() { navStep("fw") });

    document.getElementById('gv-nav-up').addEventListener('click', function() { navStep("fw") });
    document.getElementById('gv-nav-down').addEventListener('click', function() { navStep("bw") });

    addScrollListeners();

    window.addEventListener('resize', function() {
      // clear the timeout
      clearTimeout(resizeTimeout);
      // start timing for event "completion"
      resizeTimeout = setTimeout(updateViewAfterResize, 250);
    });

    window.onbeforeunload = function(){ window.scrollTo(0,0); } //resets scroll on load

}

function updateViewAfterResize() {
    checkFixView();
    checkLevelViewScroll(500);
}

function navStep(a) {

    Scrolling.remove(window, updateViewAfterScroll);

    let maxSteps = [].slice.apply(document.querySelectorAll('.gvInnerBOX'))[0].getAttribute("data-maxsteps");
    maxSteps = Number(maxSteps);
 
    if (a == "fw" && globalLevel < maxSteps) {
        globalLevel += 1;
    }

    if (a == "bw" && globalLevel > 0) {
        globalLevel -= 1;
    }

    if (globalLevel >= maxSteps) {
        globalLevel = 0;
        document.querySelector("#gv-navs").classList.remove("gv-mobile-hide");
        document.getElementById('gv-nav-down').classList.remove("disabled");
    } else if (globalLevel < 0) {
        globalLevel = 0; 
    }

    if (globalLevel == 0) {
        document.getElementById('gv-nav-down').classList.add("disabled");
    }

    else if (globalLevel > 0) {
        document.getElementById('gv-nav-down').classList.remove("disabled");
    }
    
    let noVictims = (!document.getElementById("section-bullet-"+ globalLevel));

    console.log(noVictims)

    //this means victims
    if(!noVictims) {
        window.scrollTo(0,document.getElementById("section-bullet-"+ globalLevel).offsetTop)
    }

    // else if (isNaN(document.getElementById("section-bullet-"+ globalLevel).offsetTop) ){
    //     console.log(globalLevel)
    // }

    //updateScrollView(globalLevel);
    updateLevelView(globalLevel);
    updateInfoBox(globalLevel);

    //Scrolling(window, updateViewAfterScroll);
}


function addScrollListeners() {


    Scrolling(window, updateViewAfterScroll);
    // window.addEventListener('scroll', function() {
    //   // clear the timeout
    //   clearTimeout(scrollTimeout);
    //   // start timing for event "completion"
    //   scrollTimeout = setTimeout(updateViewAfterScroll, 250);
    // });

}

function updateViewAfterScroll(){
        checkFixView();
        // bodyScroll();
        checkLevelViewScroll(500); // PROBLEM add this val for scroll
}


// var timer = null;
// window.addEventListener('scroll', function() {
//     if(timer !== null) {
//         clearTimeout(timer);        
//     }
//     timer = setTimeout(function() {
//           //document.getElementById("right-wrap").style.backgroundColor = "red";
//     }, 500);
// }, false);

// var scrollTimer = -1;

//     function bodyScroll() {
//         document.getElementById("right-wrap").style.backgroundColor = "white";

//         if (scrollTimer != -1)
//         clearTimeout(scrollTimer);

//         scrollTimer = window.setTimeout(scrollFinished(), 500);
//     }

// function scrollFinished() {
//         document.getElementById("right-wrap").style.backgroundColor = "red";
// }

function isElementInViewport(el) {
    // https://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}

function isElementFocusedInViewport (el) {
    // https://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
    var rect = el.getBoundingClientRect();

    return (
        rect.left >= 0 &&
        rect.top >= 0 &&
        (rect.top + 300) <= (window.innerHeight || document.documentElement.clientHeight)/*or $(window).height() */
        //rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        //rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */

    );
}

// function onVisibilityChange(el, callback) {
//     var old_visible;
//     return function () {
//         var visible = isElementInViewport(el);
//         if (visible != old_visible) {
//             old_visible = visible;
//             if (typeof callback == 'function') {
//                 callback();
//             }
//         }
//     }
// }


function checkLevelViewScroll(n) {

    console.log(n);

    [].slice.apply(document.querySelectorAll('.gv-detail-item')).forEach(el => {

        if (isElementFocusedInViewport(el)) {
            var level = Number(el.getAttribute('data-level'));

            if (level < n) { n = level }
            globalLevel = n;
        }

    });

    if (n == 500) {
        n = globalLevel-1;
    }

    if (n < 0 || n > 23) {
        n = 0;
    }

    globalLevel = n + 1;    
    updateLevelView(n);
    updateInfoBox(n);
}

function updateScrollView(n){

    let mobCheckEl = document.getElementById("continueBtn");
    let scrollEl;
    let standyH = 0;
    let isMo;

    if(getStyle(mobCheckEl)=="none"){
        scrollEl = document.body;
        standyH = document.querySelector('.gv-right-standfirst').offsetHeight;    
        isMo = false;
    }

    if(getStyle(mobCheckEl)=="inline-block"){
        scrollEl = document.getElementById('right-wrap');
        standyH = document.querySelector('.gv-right-standfirst').offsetHeight;    
        isMo = true;
    }

    if(document.getElementById("section-bullet-"+n) && isMo){
        let topEl = document.getElementById("section-bullet-"+n);
        let topPos = topEl.offsetTop;
        scrollEl.scrollTop = topPos + standyH;
    }

    if(document.getElementById("section-bullet-"+n) && !isMo){
        console.log("globalLevel", globalLevel)
        let topEl = document.getElementById("section-bullet-"+n);
        let topPos = topEl.offsetTop ;
        scrollEl.scrollTop = topPos + standyH;
        //scrollIt(topEl.offsetTop)
    }

    console.log(document.getElementById("section-bullet-"+n))

    // [].slice.apply(document.querySelectorAll('.gv-section-bullet-wrapper')).forEach(el => {  
    //         console.log(el.getAttribute("section-ref"));    
    // });
   
}

function updateLevelView(n) {

    if (n > 0) {
        document.querySelector(".gvLevelsBOXWRAPPER").classList.remove("gv-hide")
    } else if (n == 0) {
        document.querySelector(".gvLevelsBOXWRAPPER").classList.add("gv-hide")
    }

    var levelIndex = n;

    var t = document.getElementById("level-" + levelIndex);


    [].slice.apply(document.querySelectorAll('.gv-level')).forEach(el => {
        el.classList.remove("highlight")
    });

    t.classList.add("highlight");

    var y = 0 - t.transform.baseVal.getItem(0).matrix.f;

    var svgWidth = "";

    var svg = document.getElementById("gv-tower-graphic-svg"); // or other selector like querySelector()
    var rect = svg.getBoundingClientRect(); // get the bounding rectangle

    //console.log( rect.width );

    var scale = (rect.width / 839); // initial width of svg

    y *= scale; // correct for svg resize

    if (isMobile()) {
        y= y+70;
        //console.log("TRUE")
    }

    // updateInfoBox(n);

    document.getElementById("gv-tower-graphic").style = "transform:translateY(" + y + "px)";

}

function openOverlay(el) {
    //console.log(el.getAttribute("data-level"))
}

function updateInfoBox(n) {

    document.getElementById("gv-tower-graphic-intro").classList.add("gv-hide");

    [].slice.apply(document.querySelectorAll('.gvInnerBOX')).forEach(el => {
        el.classList.add("gv-hide");
        el.classList.remove("gv-show");
        if (el.getAttribute("data-level") == n - 1) {
            el.classList.remove("gv-hide");
            el.classList.add("gv-show");
            //setTimeout(function() { updateScrollView(n); }, 1000);

        }

    });

}



function checkFixView() {
    let h = document.getElementById("bannerandheader").offsetHeight;

    var pos_top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    // console.log("pos_top=" + pos_top);
    // console.log("h=" + h);

    if (pos_top > h) {
        document.querySelector('.gv-tower-wrapper').classList.add('fixed');
        document.querySelector('.gv-right-wrapper').classList.add('fixed');
    } else if (pos_top < h) {
        document.querySelector('.gv-tower-wrapper').classList.remove('fixed');
        document.querySelector('.gv-right-wrapper').classList.remove('fixed');
    }

}

function isScrolledIntoView(el) {
    const { top, bottom } = el.getBoundingClientRect()
    return top >= 0 && bottom <= window.innerHeight
}


function hideRightView() {
    document.querySelector('.gv-right-view').classList.remove('open');
    document.querySelector('.gv-right-view').classList.add('close');
    document.querySelector('.close-overlay-btn').classList.remove('open');
    document.querySelector('.close-overlay-btn').classList.add('close');
}

function openRightView(n) {
    // console.log(n)
    document.querySelector('.gv-right-view').classList.remove('close');
    document.querySelector('.gv-right-view').classList.add('open');
    document.querySelector('.close-overlay-btn').classList.remove('close');
    document.querySelector('.close-overlay-btn').classList.add('open');
}

function sortByKeys(obj) {
    let keys = Object.keys(obj),
        i, len = keys.length;

    keys.sort();

    var a = []

    for (i = 0; i < len; i++) {
        let k = keys[i];
        let t = {}
        t.sortOn = k;
        t.objArr = obj[k]
        a.push(t);
    }

    return a;
}


function updatePageDate() {
    document.querySelector(".time-stamp").innerHTML = " ";

    let pubDate;

    if (window.guardian.config.page.webPublicationDate) {
        pubDate = new Date(window.guardian.config.page.webPublicationDate)
        var d = new Date(window.guardian.config.page.webPublicationDate)
        var n = d.getTimezoneOffset();

        let pubDateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }; //, timeZone: 'UTC', timeZoneName: 'short'

        let dateStr = pubDate.toLocaleDateString('en-GB', pubDateOptions).split(",").join(" ").split("  ").join(" ");

        dateStr = dateStr + " GMT";

        document.querySelector(".time-stamp").innerHTML = dateStr;
    }

}

function notShownY(el) {
    return (el.offsetHeight * -1) > el.getBoundingClientRect().top;
}




function scrollIt(destination, duration = 200, easing = 'linear', callback) {

// https://pawelgrzybek.com/page-scroll-in-vanilla-javascript/

  const easings = {
    linear(t) {
      return t;
    },
    easeInQuad(t) {
      return t * t;
    },
    easeOutQuad(t) {
      return t * (2 - t);
    },
    easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    easeInCubic(t) {
      return t * t * t;
    },
    easeOutCubic(t) {
      return (--t) * t * t + 1;
    },
    easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    easeInQuart(t) {
      return t * t * t * t;
    },
    easeOutQuart(t) {
      return 1 - (--t) * t * t * t;
    },
    easeInOutQuart(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    },
    easeInQuint(t) {
      return t * t * t * t * t;
    },
    easeOutQuint(t) {
      return 1 + (--t) * t * t * t * t;
    },
    easeInOutQuint(t) {
      return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
    }
  };

  const start = window.pageYOffset;
  const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

  const documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
  const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
  const destinationOffset = typeof destination === 'number' ? destination : destination.offsetTop;
  const destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);

  if ('requestAnimationFrame' in window === false) {
    window.scroll(0, destinationOffsetToScroll);
    if (callback) {
      callback();
    }
    return;
  }

  function scroll() {
    const now = 'now' in window.performance ? performance.now() : new Date().getTime();
    const time = Math.min(1, ((now - startTime) / duration));
    const timeFunction = easings[easing](time);
    window.scroll(0, Math.ceil((timeFunction * (destinationOffsetToScroll - start)) + start));

    if (window.pageYOffset === destinationOffsetToScroll) {
      if (callback) {
        callback();
      }
      return;
    }

    requestAnimationFrame(scroll);
  }

  scroll();
}