import Handlebars from 'handlebars/dist/handlebars'
import rp from 'request-promise'
import mainTemplate from './src/templates/main.html!text'

// export async function render() {

//     return mainTemplate;

// }

export function render() {
    return rp({
        uri: 'https://interactive.guim.co.uk/docsdata/1e0h3eAZRkXJCrh5jN7TIRkp-qkMBa1WjihzdOalpOYE.json',
        json: true
    }).then((data) => {
        var sheets = data.sheets;
        //console.log(sheets);
        //var html = Mustache.render(mainTemplate, sheets, partialTemplates);
        var html = mainTemplate;
        return html;
    });

  
}

