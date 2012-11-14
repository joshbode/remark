var marked = require('marked')
  , config = require('./config')
  , converter = module.exports = {}
  ;

converter.convertContentClasses = function (content) {
  var classFinder = /(\\)?((?:\.[a-z_\-][a-z\-_0-9]*)+)\[/ig
    , match
    , classes
    , text
    , replacement
    , tag
    , after
    ;

  while ((match = classFinder.exec(content.innerHTML)) !== null) {
    text = getSquareBracketedText(content.innerHTML.substr(
          match.index + match[0].length));

    if (text === null) {
      continue;
    }
    
    if (match[1]) {
      // Simply remove escape slash
      replacement = match[2] + '[' + text + ']';
      classFinder.lastIndex = match.index + replacement.length;
    }
    else {
      classes = match[2].substr(1).split('.');
      tag = text.indexOf('\n') === -1 ? 'span' : 'div';

      replacement = "&lt;" + tag + " class=\"" + 
        classes.join(' ') + 
        "\"&gt;" + 
        text +
        "&lt;/" + tag + "&gt;";

      classFinder.lastIndex = match.index + 
        ("&lt;" + tag + " class=\"" + classes.join(' ') + "\"&gt;").length;
    }

    after = content.innerHTML.substr(
        match.index + match[0].length + text.length + 1);

    content.innerHTML = content.innerHTML.substr(0, match.index) +
      replacement + after;
  }
};

var getSquareBracketedText = function (text) {
  var count = 1
    , pos = 0
    , chr
    ;

  while (count > 0 && pos < text.length) {
    chr = text[pos++];
    count += (chr === '[' && 1) || (chr === ']' && -1) || 0;
  }

  return count === 0 && text.substr(0, pos - 1) || null;
};

converter.convertMarkdown = function (content) {

  // convert content to raw markdown source string
  var source = "";
  for (var i = 0; i < content.childNodes.length; ++i) {
    var node = content.childNodes[i];
    source += node.nodeName === "#text" ? node.data : node.outerHTML + '\n';
  }
  source = source.trim();

  content.innerHTML = marked(source.replace(/^\s+/, ''));

  content.innerHTML = content.innerHTML.replace(/&[l|g]t;/g,
    function (match) {
      return match === '&lt;' ? '<' : '>';
    });

  content.innerHTML = content.innerHTML.replace(/&amp;/g, '&');
};

converter.convertCodeClasses = function (content) {
  var codeBlocks = content.getElementsByTagName('code')
    , i
    ;

  for (i = 0; i < codeBlocks.length; i++) {
    convertCodeClass(codeBlocks[i]);
  }
};

var convertCodeClass = function (block) {
  var defaultClass = config.highlightLanguage
    , highlightInline = config.highlightInline
    , isInlineCode = block.parentNode.nodeName.toUpperCase() !== 'PRE'
    ;

    if (setCodeClass(block) || transformCodeClass(block)) {
      return;
    }

    if (isInlineCode && !highlightInline) {
      block.className = 'no-highlight';
    }
    else if (defaultClass) {
      block.className = defaultClass;
    }
};

var setCodeClass = function (block) {
  var classFinder = /^(\\)?\.([a-z_\-][a-z\-_0-9]*)(?:\n|\ )/i
    , match
    ;

  if ((match = classFinder.exec(block.innerHTML)) !== null) {
    if (match[1]) {
      block.innerHTML = block.innerHTML.substr(match[1].length);
    }
    else {
      block.innerHTML = block.innerHTML.substr(match[0].length);
      block.className = match[2];
      return true;
    }
  }

  return false;
};

var transformCodeClass = function (block) {
  var className = block.className || '';

  block.className = className.replace('lang-', '');

  return block.className !== className;
};

converter.trimEmptySpace = function (content) {
  content.innerHTML = content.innerHTML.replace(/<p>\s*<\/p>/g, '');
};
