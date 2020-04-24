const HandleBars = require('handlebars');
const fs = require('fs');
const path = require('path');
const {isUrl, sha1Hash, getFileExt, helperDefs} = require('./helpers');
const {updateBiblio, visit} = require('spec-md');
const crypto = require('crypto');

require('handlebars-helpers')({handlebars:HandleBars})
helperDefs.forEach((val)=>HandleBars.registerHelper(val.name, val.fn));


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

function writeAttachments(ast, dir, attachDir) {

  if(fs.existsSync(attachDir))
    fs.rmdirSync(attachDir, {recursive: true});

  fs.mkdirSync(attachDir);

  visit(ast, {
    leave: function(node){
      switch(node.type) {
        case 'Image':
          const url = node.url;

          if(!url || typeof url !== 'string' || !url.trim())
            return undefined;

          let isValidUrl = isUrl(url);

          let isValidPath = true;
          try {
            path.parse(url);
          } catch(error) {
            isValidPath = false;
          }

          if(!isValidUrl && !isValidPath)
            return undefined;

          if(url[0] === '#')
            return undefined;

          const pathToFile = path.resolve(path.resolve(dir,node.subdir), url);
          const fileExists = fs.existsSync(pathToFile);
          if(!fileExists)
            throw new Error(`While processing attachments, found that file does not exist at ${pathToFile}`);

          const fileHash = sha1Hash(url);
          const fileExt = getFileExt(pathToFile);
          const newUrlName = `${fileHash}${fileExt ? fileExt : ''}`;

          fs.copyFileSync(pathToFile, path.resolve(attachDir, newUrlName));

          return undefined;
      }
    }
  });
}

module.exports = function(args, parsePromise, _options) {
  const attachDir = args.length > 1
                  ? path.resolve(process.cwd(), args[1])
                  : null;

  const markdownFile = args[0];

  const dir = path.dirname(path.resolve(process.cwd(), markdownFile));

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
    options.attachDir = attachDir;

    if(attachDir)
      writeAttachments(ast, dir, attachDir);

    return compiledTemplate({ast, options});
  });
}
