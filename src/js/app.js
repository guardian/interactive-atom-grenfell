//import 'svelte/ssr/register'

import xr from 'xr'
import Handlebars from 'handlebars/dist/handlebars'
import { groupBy } from './libs/arrayObjectUtils.js'
import { share } from './libs/share.js';

import mainTemplate from '../templates/mainList.html'
import gridPicTemplate from '../templates/gridPic.html'
import detailItemTemplate from '../templates/detailItem.html'
import gridThumbTemplate from '../templates/thumbPic.html' 
import thumbsTemplate from '../templates/thumbsGallery.html'

var shareFn = share('Grenfell Tower','https://gu.com/p/72vvx');

let headerVisible = true;

let globalLevel = 23; // Index sets initial view to top of tower


xr.get('https://interactive.guim.co.uk/docsdata-test/1K896qTOpgJQhG2IfGAChZ1WZjQAYn7-i869tA5cKaVU.json').then((resp) => {
    var data = formatData(resp.data.sheets.people);
    var compiledHTML = compileHTML(data);
    document.querySelector(".gv-right-view").innerHTML = compiledHTML;
    addListeners();
    updatePageDate();
    upDatePageView(data);
});


function formatData(dataIn){

	var newObj = {};

	dataIn.map((obj)=>{
		if(!obj.floor){ obj.floor = "unknown"; }
		if(!obj.age){ obj.age = "unknown"; }
		if(!obj.status){ obj.status = "unknown"; }

		obj.formatName = obj.name.split(",")[0];
        obj.sortName = obj.family_name + obj.formatName;
	})

	let floorArr = groupBy(dataIn, 'floor');

    floorArr = sortByKeys(floorArr);

    floorArr.map((obj) => {
        obj.count = obj.objArr.length;  
       // console.log(obj)
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

 function upDatePageView(data){
   
    data.floorSections.map((obj)=>{
        if(!isNaN(obj.sortOn)){
            var newThumbGallery = addThumbGallery(obj);
            console.log( obj.sortOn-1, document.getElementById("thumbs-holder-"+(obj.sortOn-1)) )
            document.getElementById("thumbs-holder-"+(obj.sortOn-1)).innerHTML = newThumbGallery;
        }
        
        
    })
 }

 function addThumbGallery(dataIn){
    //console.log(dataIn);
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

function addListeners(){
    [].slice.apply(document.querySelectorAll('.gv-share-container button')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
    });

   document.querySelector('.close-overlay-btn').addEventListener('click', hideRightView);
   document.getElementById('gv-nav-up').addEventListener('click', function(){ navStep("fw")});
   document.getElementById('gv-nav-down').addEventListener('click',  function(){ navStep("bw")});
   document.querySelector('.gv-continue-button').addEventListener('click', function(){ navStep("fw")});
   addScrollListeners();

}


function navStep(a){
    let maxSteps = [].slice.apply(document.querySelectorAll('.gvInnerBOX'))[0].getAttribute("data-maxsteps");

        if(a=="fw" && globalLevel<maxSteps){
            globalLevel+=1;
        }

        if(a=="bw" && globalLevel>0){
            globalLevel-=1;
        }


        updateLevelView(globalLevel);

}


function addScrollListeners(){
       document.addEventListener("scroll", function(evt) {
                checkFixView();
                checkLevelViewScroll(500);
        });

}




function isElementInViewport (el) {
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
        rect.top >= 0 &&
        rect.top < ((window.innerHeight / 2) || (document.documentElement.clientHeight / 2)) &&
        rect.left >= 0 &&
        // rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
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


function checkLevelViewScroll(n){

   // Below was '.gv-detail-text-wrapper'

    [].slice.apply(document.querySelectorAll('.gv-detail-item')).forEach(el => {
            if(isElementInViewport(el)){                
               var level = Number(el.getAttribute('data-level'));

                if (level < n){ n = level }
                    globalLevel = n;
                } 

    });

    globalLevel = n + 1;

    console.log(n);

    updateLevelView(n);

}

function updateLevelView(n){

    if (n > 0){ 
        document.querySelector(".gvLevelsBOXWRAPPER").classList.remove("gv-hide")  
    }else if  (n == 0){ 
        document.querySelector(".gvLevelsBOXWRAPPER").classList.add("gv-hide")  

    }

    var levelIndex = n + 1; // Floor index 1 more than level index

    var t = document.getElementById("level-"+levelIndex );

    [].slice.apply(document.querySelectorAll('.gv-level')).forEach(el => {
           el.classList.remove("highlight")   
    });

    t.classList.add("highlight");

    updateInfoBox(n);

    //console.log(n+", "+t.transform.baseVal.getItem(0).matrix.e + ", " + t.transform.baseVal.getItem(0).matrix.f)

    var y = 0 - t.transform.baseVal.getItem(0).matrix.f;

    //var rect = t.getBoundingClientRect();

    var svgWidth = "";

    var svg   = document.getElementById("gv-tower-graphic-svg"); // or other selector like querySelector()
    var rect = svg.getBoundingClientRect(); // get the bounding rectangle
    
    console.log( rect.width );

    var scale = (rect.width / 839);

    y *= scale;

    //percY = y;

    //svgheight = 1763;

    //console.log( rect.height);

    //console.log("rect");

    //var rectTop = rect.top;
    //y = -(window.pageYOffset + rectTop);
    //document.getElementById("gv-tower-graphic").style = "margin-top:"+y+"px";

    document.getElementById("gv-tower-graphic").style = "transform:translateY("+y+"px)";

    //document.getElementById("gv-tower-graphic").style = "transform:translateY("+percY+"%)";

}

function updateInfoBox(n){
    //document.getElementById("gv-tower-graphic-intro").classList.add("gv-hide");

    [].slice.apply(document.querySelectorAll('.gvInnerBOX')).forEach(el => {
        el.classList.add("gv-hide");
        el.classList.remove("gv-show");
        if (el.getAttribute("data-level")==n-1){ 
                 el.classList.remove("gv-hide");
                 el.classList.add("gv-show")
             }
        
    });

    
}



function checkFixView(){
    let h = document.getElementById("bannerandheader").offsetHeight;

    var pos_top = document.body.scrollTop;   

    if(pos_top > h){
       document.querySelector('.gv-tower-wrapper').classList.add('fixed');
       document.querySelector('.gv-right-wrapper').classList.add('fixed');
    }

    else if(pos_top < h){
       document.querySelector('.gv-tower-wrapper').classList.remove('fixed');
       document.querySelector('.gv-right-wrapper').classList.remove('fixed');
    }

}

function isScrolledIntoView(el) {
  const { top, bottom } = el.getBoundingClientRect()
  return top >= 0 && bottom <= window.innerHeight
}


function hideRightView(){
    document.querySelector('.gv-right-wrapper').classList.remove('open');
    document.querySelector('.gv-right-wrapper').classList.add('close');
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

    if (window.guardian.config.page.webPublicationDate) { pubDate = new Date(window.guardian.config.page.webPublicationDate) 
        var d = new Date(window.guardian.config.page.webPublicationDate)
        var n = d.getTimezoneOffset();
        
    let pubDateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }; //, timeZone: 'UTC', timeZoneName: 'short'

    let dateStr = pubDate.toLocaleDateString('en-GB', pubDateOptions).split(",").join(" ").split("  ").join(" ");

    dateStr = dateStr+" GMT";

    document.querySelector(".time-stamp").innerHTML = dateStr;
    }
  
}

function notShownY(el) {
    return (el.offsetHeight * -1) > el.getBoundingClientRect().top;
}
