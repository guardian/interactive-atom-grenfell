//import 'svelte/ssr/register'

import xr from 'xr'
import Handlebars from 'handlebars/dist/handlebars'
import { groupBy } from './libs/arrayObjectUtils.js'
import { share } from './libs/share.js';

import mainTemplate from '../templates/mainList.html'
import gridPicTemplate from '../templates/gridPic.html'
import detailItemTemplate from '../templates/detailItem.html'

var shareFn = share('Grenfell Tower','https://gu.com/p/72vvx');

let headerVisible = true;

let globalLevel = 0;

let step = 0;

xr.get('https://interactive.guim.co.uk/docsdata-test/1K896qTOpgJQhG2IfGAChZ1WZjQAYn7-i869tA5cKaVU.json').then((resp) => {

    var compiledHTML = compileHTML(resp.data.sheets.people);

    document.querySelector(".gv-right-view").innerHTML = compiledHTML;

    addListeners();

    updatePageDate();


      //document.querySelector(".gv-tower-graphic").innerHTML = "load svg here"
    // adjustView();

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
	var data = formatData(dataIn);
	
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

	
    var newHTML = content(data);

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

   addScrollListeners();
}


function navStep(a){
    if(a=="fw" && step<maxSteps){
        step+=1;
    }

    if(a=="bw" && step>0){
        step-=1;
    }

    let l = document.getElementById("level-"+step);

   // console.log(l);
    
}


function addScrollListeners(){
       document.addEventListener("scroll", function(evt) {
                checkFixView();
                checkLevelView();
        });

       console.log(document.body.scrollTop)
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


function checkLevelView(){

    var n = 500;

    [].slice.apply(document.querySelectorAll('.gv-detail-text-wrapper')).forEach(el => {
            if(isElementInViewport(el)){
                
                var level = Number(el.getAttribute('data-level'));
                if (level < n){ n = level }
                globalLevel = n;
              
            }
           
    });

    updateLevelView(n) 
}

function updateLevelView(n){
    var t = document.getElementById("level-"+n);

       [].slice.apply(document.querySelectorAll('.gv-level')).forEach(el => {
           el.classList.remove("highlight")
           
    });

    t.classList.add("highlight")   

    console.log(n+", "+t.transform.baseVal.getItem(0).matrix.e + ", " + t.transform.baseVal.getItem(0).matrix.f)

    var y = 0 - t.transform.baseVal.getItem(0).matrix.f;

    document.getElementById("gv-tower-graphic").style = "transform:translateY("+y+"px)"

}


function updateTowerLevel(n){
    console.log(n)
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
        console.log(n/60)
    let pubDateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }; //, timeZone: 'UTC', timeZoneName: 'short'

    let dateStr = pubDate.toLocaleDateString('en-GB', pubDateOptions).split(",").join(" ").split("  ").join(" ");

    dateStr = dateStr+" GMT";

    document.querySelector(".time-stamp").innerHTML = dateStr;
    }
  
}

function notShownY(el) {
    return (el.offsetHeight * -1) > el.getBoundingClientRect().top;
}
