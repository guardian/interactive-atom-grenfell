import Handlebars from 'handlebars/dist/handlebars'
import rp from 'request-promise'
import mainTemplate from './src/templates/main.html!text'


Handlebars.registerHelper("ifvalue", function(conditional, options) {
    if (conditional == options.hash.equals) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});


export function render() {
    return rp({
        uri: 'https://interactive.guim.co.uk/docsdata/1e0h3eAZRkXJCrh5jN7TIRkp-qkMBa1WjihzdOalpOYE.json',
        json: true
    }).then((data) => {
        var sheets = data.sheets;        
        var maxSteps = sheets.Floors.length;

        sheets.Floors.map((obj,k)=>{
            obj.maxSteps = maxSteps; //aded maxSteps ref for app.js

            if(obj.Victims_status){
                obj.hasVictims = true;
            }else{
                obj.hasVictims = false;
            }

            if(obj.Time_standfirst){
                obj.hasTimeCopy = true;
            }else{
                obj.hasTimeCopy = false;
            }

            if(obj.Summary){
                obj.hasSummary = true;
            }else{
                obj.hasSummary = false;
            }

        })

        var hbMainTemplate = Handlebars.compile(mainTemplate);
        var compiled = hbMainTemplate(sheets);
        var html = compiled;
        return html;
    });

  
}

