const HandleBars = require('handlebars');
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');
const {updateBiblio} = require('spec-md');
require('handlebars-helpers')({handlebars:HandleBars})
helpers.forEach((val)=>HandleBars.registerHelper(val.name, val.fn));


function loadPartials() {
  var partialsDir = path.resolve(__dirname, '../templates/partials/');
  var filenames = fs.readdirSync(partialsDir);

  filenames.forEach(function (filename) {
    var matches = /^([^.]+).hbr$/.exec(filename);
    if (!matches) {
      return;
    }
    var name = matches[1];
    var template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
    HandleBars.registerPartial(name, template);
  });
}

function loadMainTemplate() {
  var mainTemplate = fs.readFileSync(path.resolve(__dirname, '../templates/index.hbr')).toString();
  return HandleBars.compile(mainTemplate);
}

module.exports = function(args, parsePromise, _options) {
  var compiledTemplate = null;
  try {
    loadPartials();
    compiledTemplate = loadMainTemplate();
  } catch(error) {
    console.error('An error occurred while loading partials');
    throw error;
  }

  return parsePromise.then(function(ast){
    const options = updateBiblio(ast, _options);
    return compiledTemplate({ast, options});
  });
}
