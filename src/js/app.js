//import 'svelte/ssr/register'

import xr from 'xr'
import Handlebars from 'handlebars/dist/handlebars'
import { groupBy } from './libs/arrayObjectUtils.js'
import { share } from './libs/share.js';

import mainTemplate from '../templates/mainList.html'
import gridPicTemplate from '../templates/gridPic.html'
import detailItemTemplate from '../templates/detailItem.html'

var shareFn = share('Grenfell Tower','https://gu.com/p/72vvx');


xr.get('https://interactive.guim.co.uk/docsdata-test/1K896qTOpgJQhG2IfGAChZ1WZjQAYn7-i869tA5cKaVU.json').then((resp) => {

    var compiledHTML = compileHTML(resp.data.sheets.people);

    document.querySelector(".gv-right-view").innerHTML = compiledHTML;

    addListeners();

    updatePageDate();

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

   // document.querySelector()
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
  

    //console.log(pubDate);
}
