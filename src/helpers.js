const { formatText, escape, getTerms, anchorize, escapeCode } = require('spec-md');
const crypto = require('crypto');
const path = require('path');

function getHelperDef(func) {
  return { name: func.name, fn: func };
}

function sha1Hash(str) {
  const shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
}

function isUrl(url) {
  if(!url || typeof url !== 'string' || !url.trim())
    return false;

  let isValidUrl = true;
  try {
    new URL(url);
  } catch(error) {
    if(error.code === 'ERR_INVALID_URL')
      isValidUrl = false;
  }

  return isValidUrl;
}

function getFileExt(filePath) {
  return path.extname(filePath);
}

function filterNot(array, prop, value, options) {
  var results = null;
  results = array.filter((val) => {
    return value !== val[prop];
  });

  function isBlank(str) {
    return (!str || /^\s*$/.test(str));
  }

  return results.map(options.fn).filter(val => !isBlank(val))
    .join(options.hash.separator ? options.hash.separator : '');
}

function processTerms(ast, executionOptions, options) {
  const terms = getTerms(ast);
  const termNames = Object.keys(terms).sort();
  if (termNames.length === 0)
    return '';



  return termNames.map(name =>
    options.fn(({
      name,
      nodeId: terms[name].id,
      href: executionOptions.biblio[terms[name].id],
      externalLink: executionOptions.biblio[terms[name].id][0] !== '#'
    }))).join('');
}

function exampleString(node) {
  return node.counter
    ? `Counter Example #${node.number}`
    : node.example
      ? `Example #${node.number}`
      : false;
}

function removeAnchorization(href) {
  return href[0] === '#' ? href.slice(1) : href;
}

function isAnchorUrl(href) {
  return href[0] === '#';
}

const LANG_LOOKUP = {
  js: 'JavaScript',
  csharp: 'C#',
  bash: 'Bash',
  as3: 'ActionScript',
  osascript: 'AppleScript',
  cpp: 'C++',
  css: 'CSS',
  cfm: 'ColdFusion',
  cfml: 'ColdFusion',
  delphi: 'Delphi'
}

function translateLanguage(lang) {
  return LANG_LOOKUP[lang] ? LANG_LOOKUP[lang] : lang;
}

function repeat(string, times) {
  return string.repeat(times);
}

module.exports = {
  isUrl,
  sha1Hash,
  getFileExt,
  helperDefs: [
    getHelperDef(getFileExt),
    getHelperDef(sha1Hash),
    getHelperDef(isUrl),
    getHelperDef(filterNot),
    getHelperDef(formatText),
    getHelperDef(escape),
    getHelperDef(processTerms),
    getHelperDef(anchorize),
    getHelperDef(encodeURI),
    getHelperDef(exampleString),
    getHelperDef(escapeCode),
    getHelperDef(removeAnchorization),
    getHelperDef(isAnchorUrl),
    getHelperDef(translateLanguage),
    getHelperDef(repeat)
  ]
}
