//import 'svelte/ssr/register'

import xr from 'xr'
import Handlebars from 'handlebars/dist/handlebars'
import { groupBy } from './libs/arrayObjectUtils.js'
import mainTemplate from '../templates/mainList.html'
import gridPicTemplate from '../templates/gridPic.html'
import detailItemTemplate from '../templates/detailItem.html'


xr.get('https://interactive.guim.co.uk/docsdata-test/1K896qTOpgJQhG2IfGAChZ1WZjQAYn7-i869tA5cKaVU.json').then((resp) => {
    // let d = resp.data.sheets.Sheet1;
    // var newObj = {};
    // newObj.objArr = d;
    // var compiledHTML = compileHTML(newObj);

    console.log(resp)

    //document.querySelector(".gv-interactive-container").innerHTML = compiledHTML;

    // addListeners();

    // updatePageDate();

    // adjustView();

});


function compileHTML(dataIn) {   
   // let data = dataFormatForHTML(dataIn);

    // Handlebars.registerHelper('html_decoder', function(text) {
    //       var str = unescape(text).replace(/&amp;/g, '&');
    //       return str; 
    // });

    // Handlebars.registerPartial({
    //     'gridPic': gridPicTemplate,
    //     'detailItem': detailItemTemplate
    // });

    // var content = Handlebars.compile(
    //     mainTemplate, {
    //         compat: true
    //     }
    // );

//     var newHTML = content(data);

//     return newHTML
	return "hej";
 }




