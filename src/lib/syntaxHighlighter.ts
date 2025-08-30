import { browser } from '$app/environment';

// Syntax highlighting utility
export function highlightCode(code: string, language: string = ''): string {
  if (!browser) return code;

  // Basic syntax highlighting for common languages
  const highlightedCode = applySyntaxHighlighting(code, language);
  return highlightedCode;
}

// Apply syntax highlighting based on language
function applySyntaxHighlighting(code: string, language: string): string {
  // Escape HTML entities
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      return highlightJavaScript(escaped);
    case 'python':
    case 'py':
      return highlightPython(escaped);
    case 'java':
      return highlightJava(escaped);
    case 'cpp':
    case 'c++':
    case 'c':
      return highlightCpp(escaped);
    case 'css':
      return highlightCss(escaped);
    case 'html':
      return highlightHtml(escaped);
    case 'json':
      return highlightJson(escaped);
    case 'sql':
      return highlightSql(escaped);
    case 'bash':
    case 'shell':
    case 'sh':
      return highlightBash(escaped);
    default:
      return highlightGeneric(escaped);
  }
}

// Generic highlighting for unknown languages
function highlightGeneric(code: string): string {
  return code
    // Highlight comments
    .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, '<span class="comment">$1</span>')
    // Highlight strings
    .replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, '<span class="string">$1$2$1</span>')
    // Highlight numbers
    .replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>');
}

// JavaScript/TypeScript highlighting
function highlightJavaScript(code: string): string {
  return code
    // Comments
    .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="comment">$1</span>')
    // Strings
    .replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, '<span class="string">$1$2$1</span>')
    // Template literals
    .replace(/`([^`]*)`/g, '<span class="string">`$1`</span>')
    // Keywords
    .replace(/\b(const|let|var|function|class|if|else|for|while|do|switch|case|default|try|catch|finally|throw|return|break|continue|new|this|super|extends|implements|import|export|from|as|async|await|yield|typeof|instanceof|in|of)\b/g, '<span class="keyword">$1</span>')
    // Built-in types and objects
    .replace(/\b(Array|String|Number|Boolean|Object|Function|Date|RegExp|Math|JSON|Promise|Set|Map|WeakMap|WeakSet|Symbol|BigInt|console|window|document|process|global|Buffer|Error)\b/g, '<span class="builtin">$1</span>')
    // Numbers
    .replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>')
    // Operators
    .replace(/(\+|\-|\*|\/|%|=|==|===|!=|!==|<|>|<=|>=|&&|\|\||!|\?|:|\.|,|;|\(|\)|\[|\]|\{|\})/g, '<span class="operator">$1</span>');
}

// Python highlighting
function highlightPython(code: string): string {
  return code
    // Comments
    .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
    // Multi-line strings
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, '<span class="string">$1</span>')
    // Regular strings
    .replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, '<span class="string">$1$2$1</span>')
    // Keywords
    .replace(/\b(def|class|if|elif|else|for|while|try|except|finally|with|as|import|from|return|yield|raise|break|continue|pass|lambda|and|or|not|in|is|global|nonlocal|assert|del|exec|print)\b/g, '<span class="keyword">$1</span>')
    // Built-in functions
    .replace(/\b(len|range|enumerate|zip|map|filter|reduce|sum|min|max|abs|round|int|float|str|list|dict|set|tuple|open|print|input|type|isinstance|hasattr|getattr|setattr|dir|help)\b/g, '<span class="builtin">$1</span>')
    // Numbers
    .replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>')
    // Operators
    .replace(/(\+|\-|\*|\/|\/\/|%|=|==|!=|<|>|<=|>=|and|or|not|in|is|\.|,|:|\(|\)|\[|\]|\{|\})/g, '<span class="operator">$1</span>');
}

// Java highlighting
function highlightJava(code: string): string {
  return code
    // Comments
    .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="comment">$1</span>')
    // Strings
    .replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, '<span class="string">$1$2$1</span>')
    // Keywords
    .replace(/\b(public|private|protected|static|final|abstract|class|interface|extends|implements|new|this|super|return|if|else|for|while|do|switch|case|default|try|catch|finally|throw|throws|import|package|void|int|long|float|double|boolean|char|String|System|out|println|print)\b/g, '<span class="keyword">$1</span>')
    // Numbers
    .replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>')
    // Operators
    .replace(/(\+|\-|\*|\/|%|=|==|!=|<|>|<=|>=|&&|\|\||!|\?|:|\.|,|;|\(|\)|\[|\]|\{|\})/g, '<span class="operator">$1</span>');
}

// C/C++ highlighting
function highlightCpp(code: string): string {
  return code
    // Comments
    .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="comment">$1</span>')
    // Strings
    .replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, '<span class="string">$1$2$1</span>')
    // Keywords
    .replace(/\b(int|float|double|char|void|bool|auto|const|static|extern|inline|virtual|class|struct|union|enum|namespace|template|typename|using|public|private|protected|friend|operator|new|delete|this|throw|try|catch|if|else|for|while|do|switch|case|default|break|continue|return|goto|sizeof|typedef|include)\b/g, '<span class="keyword">$1</span>')
    // Preprocessor directives
    .replace(/#(include|define|ifdef|ifndef|endif|else|elif|pragma|line)/g, '<span class="preprocessor">$&</span>')
    // Standard library
    .replace(/\b(std|cout|cin|endl|string|vector|map|set|array|unique_ptr|shared_ptr|weak_ptr|function|thread|mutex|atomic|chrono|filesystem|iostream|fstream|sstream|algorithm|numeric)\b/g, '<span class="builtin">$1</span>')
    // Numbers
    .replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>')
    // Operators
    .replace(/(\+|\-|\*|\/|%|=|==|!=|<|>|<=|>=|&&|\|\||!|\?|:|::|\.|,|;|\(|\)|\[|\]|\{|\}|\&|\||\^|~|<<|>>)/g, '<span class="operator">$1</span>');
}

// CSS highlighting
function highlightCss(code: string): string {
  return code
    // Comments
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
    // Strings
    .replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, '<span class="string">$1$2$1</span>')
    // Properties
    .replace(/([a-z-]+)(?=\s*:)/g, '<span class="property">$1</span>')
    // Values
    .replace(/:\s*([^;]+);/g, ': <span class="value">$1</span>;')
    // Selectors
    .replace(/^([^{]+)\{/gm, '<span class="selector">$1</span>{')
    // Units
    .replace(/\b(\d+)(px|em|rem|vh|vw|vmin|vmax|%|pt|pc|in|cm|mm|ex|ch)\b/g, '<span class="number">$1</span><span class="unit">$2</span>')
    // Numbers
    .replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>')
    // At-rules
    .replace(/(@[a-z-]+)\s+/g, '<span class="atrule">$1</span> ')
    // Operators
    .replace(/(\{|\}|;|:|,|\(|\))/g, '<span class="operator">$1</span>');
}

// HTML highlighting
function highlightHtml(code: string): string {
  return code
    // Comments
    .replace(/(<!--[\s\S]*?-->)/g, '<span class="comment">$1</span>')
    // Tags
    .replace(/(<\/?[a-zA-Z][^>]*>)/g, '<span class="tag">$1</span>')
    // Attributes
    .replace(/\s([a-z-]+)(?=\s*=\s*["'])/g, ' <span class="attribute">$1</span>')
    // Attribute values
    .replace(/=\s*(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, '= <span class="string">$1$2$1</span>')
    // Operators
    .replace(/(&lt;|&gt;|&amp;|&quot;|&#39;)/g, '<span class="operator">$1</span>');
}

// JSON highlighting
function highlightJson(code: string): string {
  return code
    // Strings
    .replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, '<span class="string">$1$2$1</span>')
    // Numbers
    .replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>')
    // Booleans and null
    .replace(/\b(true|false|null)\b/g, '<span class="keyword">$1</span>')
    // Operators
    .replace(/(\{|\}|\[|\]|,|:)/g, '<span class="operator">$1</span>');
}

// SQL highlighting
function highlightSql(code: string): string {
  return code
    // Comments
    .replace(/(--.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="comment">$1</span>')
    // Strings
    .replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, '<span class="string">$1$2$1</span>')
    // Keywords
    .replace(/\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|GROUP|BY|HAVING|ORDER|LIMIT|OFFSET|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|DATABASE|SCHEMA|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|NOT|NULL|DEFAULT|AUTO_INCREMENT|UNSIGNED|ZEROFILL|BINARY|VARBINARY|TINYBLOB|BLOB|MEDIUMBLOB|LONGBLOB|TINYTEXT|TEXT|MEDIUMTEXT|LONGTEXT|ENUM|SET|DATE|TIME|DATETIME|TIMESTAMP|YEAR|CHAR|VARCHAR|BINARY|VARBINARY|TINYBLOB|BLOB|MEDIUMBLOB|LONGBLOB|TINYTEXT|TEXT|MEDIUMTEXT|LONGTEXT|ENUM|SET|GEOMETRY|POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION|JSON|INT|TINYINT|SMALLINT|MEDIUMINT|BIGINT|FLOAT|DOUBLE|DECIMAL|BIT|BOOLEAN|SERIAL|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|DISTINCT|AS|UNION|ALL|ANY|SOME|EXCEPT|INTERSECT|CASE|WHEN|THEN|ELSE|END|BEGIN|COMMIT|ROLLBACK|START|TRANSACTION|SET|DECLARE|CURSOR|FETCH|CLOSE|OPEN|WHILE|FOR|LOOP|REPEAT|UNTIL|LEAVE|ITERATE|CALL|PROCEDURE|FUNCTION|TRIGGER|EVENT|INDEX|CONSTRAINT|CHECK|DEFAULT|REFERENCES|CASCADE|RESTRICT|NO|ACTION|ON|UPDATE|DELETE|ASC|DESC|COUNT|SUM|AVG|MIN|MAX|GROUP_CONCAT|CONCAT|SUBSTRING|REPLACE|TRIM|LENGTH|NOW|CURDATE|CURTIME|DATE|TIME|YEAR|MONTH|DAY|HOUR|MINUTE|SECOND|DATEDIFF|TIMESTAMPDIFF|DATE_ADD|DATE_SUB|IF|IFNULL|COALESCE|NULLIF|GREATEST|LEAST)\b/gi, '<span class="keyword">$1</span>')
    // Numbers
    .replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>')
    // Operators
    .replace(/(\+|\-|\*|\/|%|=|==|!=|<|>|<=|>=|<>|!<|!>|\||&|!|~|\^|<<|>>)/g, '<span class="operator">$1</span>');
}

// Bash/Shell highlighting
function highlightBash(code: string): string {
  return code
    // Comments
    .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
    // Strings
    .replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*?)\1/g, '<span class="string">$1$2$1</span>')
    // Variables
    .replace(/\$([a-zA-Z_][a-zA-Z0-9_]*|\{[^}]+\}|\$|\?|@|#|\*|-|\$|!|0-9)/g, '<span class="variable">$&</span>')
    // Commands
    .replace(/\b(echo|printf|read|cat|grep|sed|awk|cut|sort|uniq|head|tail|wc|ls|cd|pwd|mkdir|rm|cp|mv|chmod|chown|ps|kill|top|htop|df|du|free|which|whereis|find|locate|tar|gzip|bzip2|xz|zip|unzip|curl|wget|ssh|scp|rsync|git|docker|docker-compose|npm|yarn|node|python|pip|java|javac|gradle|maven|mvn|make|cmake|gcc|g\+\+|clang|rustc|cargo|go)\b/g, '<span class="builtin">$1</span>')
    // Keywords and operators
    .replace(/\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|break|continue|local|export|unset|declare|readonly|trap|wait|exec|source|\.)\b/g, '<span class="keyword">$1</span>')
    // Operators
    .replace(/(\||&|;|\(|\)|\[|\]|\{|\}|<|>|<<|>>|&&|\|\||!|\$\(|\`)/g, '<span class="operator">$1</span>')
    // Numbers
    .replace(/\b\d+(\.\d+)?\b/g, '<span class="number">$&</span>');
}

// Initialize syntax highlighting styles
export function initSyntaxHighlighting() {
  if (!browser) return;

  const style = document.createElement('style');
  style.textContent = `
    .code-block {
      position: relative;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 16px;
      margin: 8px 0;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.4;
      overflow-x: auto;
      white-space: pre;
    }

    .code-block.dark {
      background: #1e1e1e;
      border-color: #333;
      color: #d4d4d4;
    }

    .code-block .comment { color: #6a9955; }
    .code-block .string { color: #ce9178; }
    .code-block .keyword { color: #569cd6; }
    .code-block .builtin { color: #4ec9b0; }
    .code-block .number { color: #b5cea8; }
    .code-block .operator { color: #d4d4d4; }
    .code-block .variable { color: #9cdcfe; }
    .code-block .property { color: #9cdcfe; }
    .code-block .value { color: #ce9178; }
    .code-block .selector { color: #d7ba7d; }
    .code-block .tag { color: #569cd6; }
    .code-block .attribute { color: #9cdcfe; }
    .code-block .unit { color: #b5cea8; }
    .code-block .atrule { color: #c586c0; }
    .code-block .preprocessor { color: #c586c0; }

    .code-block.dark .comment { color: #6a9955; }
    .code-block.dark .string { color: #ce9178; }
    .code-block.dark .keyword { color: #569cd6; }
    .code-block.dark .builtin { color: #4ec9b0; }
    .code-block.dark .number { color: #b5cea8; }
    .code-block.dark .operator { color: #d4d4d4; }
    .code-block.dark .variable { color: #9cdcfe; }
    .code-block.dark .property { color: #9cdcfe; }
    .code-block.dark .value { color: #ce9178; }
    .code-block.dark .selector { color: #d7ba7d; }
    .code-block.dark .tag { color: #808080; }
    .code-block.dark .attribute { color: #9cdcfe; }
    .code-block.dark .unit { color: #b5cea8; }
    .code-block.dark .atrule { color: #c586c0; }
    .code-block.dark .preprocessor { color: #c586c0; }

    .code-copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #007acc;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .code-copy-btn:hover {
      background: #005a9e;
    }

    .inline-code {
      background: #f1f3f4;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 0.9em;
    }

    .inline-code-copy-btn {
      margin-left: 4px;
      background: transparent;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 12px;
      padding: 0;
      vertical-align: middle;
    }

    .inline-code-copy-btn:hover {
      color: #007acc;
    }
  `;
  document.head.appendChild(style);
}

// Process markdown content and highlight code blocks
export function processMarkdownWithCodeHighlighting(content: string): string {
  if (!browser) return content;

  // Process code blocks with language specification
  content = content.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, language, code) => {
    const highlightedCode = highlightCode(code.trim(), language || '');
    const langLabel = language ? ` data-language="${language}"` : '';
    return `<div class="code-block"${langLabel}>
      <button class="code-copy-btn" onclick="copyCodeToClipboard('${btoa(unescape(encodeURIComponent(code.trim())))}', this)">Copy</button>
      ${highlightedCode}
    </div>`;
  });

  // Process inline code
  content = content.replace(/`([^`\n]+)`/g, (match, code) => {
    const highlightedCode = highlightCode(code, 'generic');
    return `<code class="inline-code">${highlightedCode}<button class="inline-code-copy-btn" onclick="copyCodeToClipboard('${btoa(unescape(encodeURIComponent(code)))}', this)" title="Copy code">📋</button></code>`;
  });

  return content;
}

// Enhanced markdown processing with better code handling
export function processMarkdown(content: string): string {
  return processMarkdownWithCodeHighlighting(content)
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Line breaks
    .replace(/\n/g, '<br>');
}
