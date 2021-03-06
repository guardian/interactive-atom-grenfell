//import 'svelte/ssr/register'
import xr from 'xr'
import Handlebars from 'handlebars/dist/handlebars'
import Scrolling from 'scrolling';

import { groupBy } from './libs/arrayObjectUtils.js'
import { share } from './libs/share.js';

import mainTemplate from '../templates/mainList.html'
import gridPicTemplate from '../templates/gridPic.html'
import detailItemTemplate from '../templates/detailItem.html'
import gridThumbTemplate from '../templates/thumbPic.html'
import thumbsTemplate from '../templates/thumbsGallery.html'

import animateScrollTo from 'animated-scroll-to'; //https://www.npmjs.com/package/animated-scroll-to

var shareFn = share('Grenfell Tower', 'https://gu.com/p/72vvx');

let headerVisible = true;
let globalLevel = -2; // Index sets initial view after intro to basement (-1) of tower

var resizeTimeout = false;

var rightPane = null;
//var navClicked = false;
var continueClicked = false;

var lastScrollWindow = 0, lastScrollRightPane = 0, scrollDirection = 0;

let maxSteps = [].slice.apply(document.querySelectorAll('.gvInnerBOX'))[0].getAttribute("data-maxsteps");
    maxSteps = Number(maxSteps);


xr.get('https://interactive.guim.co.uk/docsdata-test/1K896qTOpgJQhG2IfGAChZ1WZjQAYn7-i869tA5cKaVU.json').then((resp) => {
    var data = formatData(resp.data.sheets.people);
    var compiledHTML = compileHTML(data);
    document.querySelector(".gv-right-view").innerHTML = compiledHTML;
    addListeners();
    updatePageDate();
    upDatePageView(data);
});

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
            //document.getElementById("thumbs-holder-" + (obj.sortOn - 1)).innerHTML = newThumbGallery;
            document.getElementById("thumbs-holder-" + (obj.sortOn)).innerHTML = newThumbGallery;
        }
    })

    document.querySelectorAll('.gv-open-overlay-btn').forEach(btnEl => {
        btnEl.addEventListener('click', function() { openRightView(btnEl.getAttribute('data-level')) });
    });

}

function addListeners() {
    [].slice.apply(document.querySelectorAll('.gv-share-container button')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click', () => shareFn(network));
    });

    document.querySelector('.close-overlay-btn').addEventListener('click', hideRightView);  
    document.querySelector('.gv-continue-button').addEventListener('click', function() { continueBtnClicked() });

    document.getElementById('gv-nav-up').addEventListener('click', function() { navStep("fw") });
    document.getElementById('gv-nav-down').addEventListener('click', function() { navStep("bw") });

    window.addEventListener('resize', function() {
      // clear the timeout
      clearTimeout(resizeTimeout);
      // start timing for event "completion"
      resizeTimeout = setTimeout(updateViewAfterResize, 250);
    });

    window.onbeforeunload = function(){ window.scrollTo(0,0); } //resets scroll on load

    Scrolling(window, updateViewAfterScroll);  // method to add a scroll listener -- https://www.npmjs.com/package/scrolling

    rightPane = document.getElementById("right-wrap");
    Scrolling(rightPane, updateViewAfterScroll);

}

function getScrollDirection() {

    var direction = 0, moved;

    if (isMobile()) {
        moved = rightPane.scrollTop - lastScrollRightPane;
    } else {
        moved = window.scrollY - lastScrollWindow;
    }

    lastScrollWindow = window.scrollY;
    lastScrollRightPane = rightPane.scrollTop;

    if (moved < 0) {
        direction = -1;
    } else if (moved > 0) {
        direction = 1;
    } else {
        direction = 0;
    }

    return direction;
}

function continueBtnClicked() {
    document.querySelector("#gv-navs").classList.remove("gv-hide"); // ADDED

    navStep("fw");

    if (isMobile()) {
        window.scrollTo(0,document.body.scrollHeight);
    }

    continueClicked = true;
}

function updateViewAfterResize() {

    if (globalLevel != -2) {
        //navStep("fw");
    
    //checkFixView();
    //checkLevelViewScroll(globalLevel); // Could be 500
    updateViewAfterScroll();
    //document.querySelector("#gv-navs").classList.remove("gv-hide"); // ADDED

    }

    if (!isMobile()) {
    rightPane.scrollTop = 0;
    document.querySelector('.gv-right-view').classList.remove('close');
    }
}



function updateViewAfterScroll(){
    var lvl;
    checkFixView();
    if (continueClicked) {
        lvl = globalLevel;
        continueClicked = false;
    } else {

    lvl = getLevelFromScroll(globalLevel);
    }

    if (globalLevel != - 2) {
   
    updateLevelView(lvl);
    updateInfoBox(lvl);

    document.querySelector("#gv-navs").classList.remove("gv-hide"); // ADDED
}
    
}

function updateViewAfterClick(){

    checkFixView();
    
    var noVictims = (!document.getElementById("section-bullet-"+ globalLevel));


    if (noVictims) { 
        updateWithoutScroll();
    } 
    if (!noVictims){
        upDateWithScroll();
    }

}

function updateWithoutScroll(){
    updateLevelView(globalLevel);
    updateInfoBox(globalLevel);
    checkNavs();
    if (isMobile()) {
        window.scrollTo(0,document.body.scrollHeight);
    }

}

function upDateWithScroll(){
   
    var target;

    if (isMobile()) {
        target = rightPane;
    } else {
        target = window;
        rightPane.scrollTop = 0;
    }

    // default options
        const options = {
          // duration of the scroll per 1000px, default 500
          speed: 500,
         
          // minimum duration of the scroll
          minDuration: 250,
         
          // maximum duration of the scroll
          maxDuration: 1500,
         
          // DOM element to scroll, default window
          // Pass a reference to a DOM object
          // Example: document.querySelector('#element-to-scroll'),
          element: target,
         
          // should animated scroll be canceled on user scroll/keypress
          // if set to "false" user input will be disabled until animated scroll is complete
          cancelOnUserAction: false,
         
          // function that will be executed when the scroll animation is finished
          onComplete: updateWithoutScroll()
        };
 
    const desiredOffset = 1000;

    animateScrollTo(document.getElementById("section-bullet-"+ globalLevel), options);
   
}

function checkNavs() {
    if (globalLevel <= -1) {
        // showIntro();
       //document.getElementById('gv-nav-down').classList.add("disabled");
    }

    else {
        document.getElementById('gv-nav-down').classList.remove("disabled");
    }

    if (globalLevel >= maxSteps - 1) {
        document.getElementById('gv-nav-up').classList.add("disabled");
    }

    else {
        document.getElementById('gv-nav-up').classList.remove("disabled");
    }
}


function navStep(a) {
 
    if (a == "fw") {
        globalLevel += 1;
    }

    if (a == "bw") {
        globalLevel -= 1;
    }

    globalLevel = checkWithinAllowedLimits(globalLevel);

    console.log(globalLevel)

    updateViewAfterClick();

    checkNavs();
   
    
    ////////
    // let noVictims = (!document.getElementById("section-bullet-"+ globalLevel));

    // if(!noVictims) {        
    //     window.scrollTo(0,(document.getElementById("section-bullet-"+ globalLevel).offsetTop - document.getElementById("right-wrap").offsetTop))
        
    // }else {
    //     updateLevelView(globalLevel);
    // }

    //navClicked = true;
    
        // clear the timeout
        //clearTimeout(navClickTimeout);
        // start timing for event "completion"
        //navClickTimeout = setTimeout(resetNavClicked, 800);
      
}

// function resetNavClicked() {
//     navClicked = false;
// }


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


function getLevelFromScroll(n) {
    
    
    var level = false, lastLevel = globalLevel;

    [].slice.apply(document.querySelectorAll('.gv-detail-item')).forEach(el => {

        if (isElementFocusedInViewport(el) && !level) {
            level = Number(el.getAttribute('data-level'));

            //if (level < n) { n = level }
            //globalLevel = n;
        }

    });


    globalLevel = level;

    if (isNaN(globalLevel) || !globalLevel) {
        globalLevel = n;
    }

    //globalLevel = n + 1;

    // if (n < 0 || n > 23) {
    //     n = 0;
    // }

    // if (n < -1) {
    //     n=-1;
    // }

    //if (n < -1 || n > 23) { // ADD TO MAIN COMBINED
        //n = -1; // ADD TO MAIN COMBINED
    //} // ADD TO MAIN COMBINED

    //globalLevel = n;
    //globalLevel = n;
    
    //updateLevelView(n); Maybe uncomment this ???????

    //return n + 1;


    // BELOW: THESE CHECK TO SEE GLOBAL LEVEL REFLECTS DIRECTION OF ANY CURRENT SCROLL - STOPS FLICKER ANOMALLY IN LEFT VIEW INFO

    scrollDirection = getScrollDirection();

    if (globalLevel > lastLevel && scrollDirection != 1) {
        globalLevel = lastLevel;
    }

     else if (globalLevel < lastLevel && scrollDirection != -1) {
        globalLevel = lastLevel;
    }

    return globalLevel;
    
}

function checkWithinAllowedLimits(n) {
    //in conditional below set n check to -1 and reinstate disabled button in checkNav fn
    if (n < -2) {
        n = -2;
    }

    if (n >= maxSteps) {
        n = -2;
    }

    return n;
}



function updateLevelView(n) {

    n = checkWithinAllowedLimits(n);

    if (n < -1 || n > maxSteps -2) {
        document.querySelector(".gvLevelsBOXWRAPPER").classList.add("gv-hide")
    } else {
        document.querySelector(".gvLevelsBOXWRAPPER").classList.remove("gv-hide")
    }

    var t = document.getElementById("level-" + n);
        [].slice.apply(document.querySelectorAll('.gv-level')).forEach(el => {
            el.classList.remove("highlight");
            el.classList.remove("path-highlight"); // ADD TO MAIN COMBINED
        });

        if (t != null) { // Not intro

        t.classList.add("highlight");

        if ( n == -1 ) { // ADD TO MAIN COMBINED// - rm1409  
            var t2 = document.getElementById("ground");
            t2.classList.add("path-highlight");
        }

        var y = 0 - t.transform.baseVal.getItem(0).matrix.f;

        var svgWidth = "";

        var svg = document.getElementById("gv-tower-graphic-svg"); 
        var rect = svg.getBoundingClientRect(); 

        var scale = (rect.width / 839); // initial width of svg

        y *= scale; // correct for svg resize

    if (isMobile()) {
        var offsetY = Math.round(100 * scale);
        y += offsetY; 
    }

    } else {
        var y = 0;
        showIntro();
    }

    document.querySelector('#gv-tower-graphic').style.webkitTransform = "translateY(" + y + "px)"; 
    document.querySelector('#gv-tower-graphic').style.MozTransform = "translateY(" + y + "px)"; 
    document.querySelector('#gv-tower-graphic').style.transform = "translateY(" + y + "px)"; 
    checkNavs();
}

function showIntro() {
    document.querySelector("#gv-navs").classList.add("gv-hide"); // ADDED
    
    document.getElementById("gv-tower-graphic-intro").classList.remove("gv-hide");

    globalLevel = -2;
    rightPane.scrollTop = 0;
}


function updateInfoBox(n) {
    if (n > - 2) {
    
    document.getElementById("gv-tower-graphic-intro").classList.add("gv-hide");

    }
   

    [].slice.apply(document.querySelectorAll('.gvInnerBOX')).forEach(el => {
        el.classList.add("gv-hide");
        el.classList.remove("gv-show");
        if (el.getAttribute("data-level") == n) {
            el.classList.remove("gv-hide");
            el.classList.add("gv-show");
        }

    });

}


function checkFixView() {
    let h = 0;

    if (document.getElementById("bannerandheader")){
        h = document.getElementById("bannerandheader").offsetHeight;
    }

    var pos_top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    if (pos_top > h) {
        document.querySelector('.gv-tower-wrapper').classList.add('fixed');
        document.querySelector('.gv-right-wrapper').classList.add('fixed');
    } else if (pos_top < h) {
        document.querySelector('.gv-tower-wrapper').classList.remove('fixed');
        document.querySelector('.gv-right-wrapper').classList.remove('fixed');
    }

}


function hideRightView() {
    document.querySelector('.gv-right-view').classList.remove('open');
    document.querySelector('.gv-right-view').classList.add('close');
    document.querySelector('.close-overlay-btn').classList.remove('open');
    document.querySelector('.close-overlay-btn').classList.add('close');
}


function openRightView(n) {
    document.querySelector('.gv-right-view').classList.remove('close');
    document.querySelector('.gv-right-view').classList.add('open');
    document.querySelector('.close-overlay-btn').classList.remove('close');
    document.querySelector('.close-overlay-btn').classList.add('open');
}


function sortByKeys(obj) {
    let keys = Object.keys(obj), i, len = keys.length;

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
