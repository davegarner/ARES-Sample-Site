
(function(){
  function escapeHtml(str){
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function inline(text){
    return text
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }
  function parse(md){
    const lines = String(md).replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let inList = false, inCode = false, inTable = false;
    let tableRows = [];
    const flushList = ()=>{ if(inList){ html += '</ul>'; inList = false; } };
    const flushTable = ()=>{
      if(!inTable) return;
      const rows = tableRows.filter(Boolean);
      if(rows.length >= 2){
        const head = rows[0].split('|').map(s=>s.trim()).filter(Boolean);
        const body = rows.slice(2).map(r=>r.split('|').map(s=>s.trim()).filter(Boolean));
        html += '<table><thead><tr>' + head.map(c=>`<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' + body.map(r=>'<tr>'+r.map(c=>`<td>${inline(c)}</td>`).join('')+'</tr>').join('') + '</tbody></table>';
      } else {
        html += rows.map(r=>`<p>${inline(r)}</p>`).join('');
      }
      inTable = false; tableRows = [];
    };
    for(let raw of lines){
      const line = raw;
      if(line.trim().startsWith('```')){
        flushList(); flushTable();
        if(!inCode){ html += '<pre><code>'; inCode = true; }
        else { html += '</code></pre>'; inCode = false; }
        continue;
      }
      if(inCode){ html += escapeHtml(line) + '\n'; continue; }
      if(/^\|.+\|\s*$/.test(line)){
        flushList();
        inTable = true; tableRows.push(line); continue;
      }
      if(inTable && !line.trim()){ flushTable(); continue; }
      if(/^\s*[-*]\s+/.test(line)){
        flushTable();
        if(!inList){ html += '<ul>'; inList = true; }
        html += '<li>' + inline(line.replace(/^\s*[-*]\s+/, '').trim()) + '</li>';
        continue;
      }
      if(/^\s*\d+\.\s+/.test(line)){
        flushList(); flushTable();
        html += '<p>' + inline(line.trim()) + '</p>'; continue;
      }
      if(!line.trim()) { flushList(); flushTable(); continue; }
      flushList();
      if(/^>\s?/.test(line)){ flushTable(); html += '<blockquote>' + inline(line.replace(/^>\s?/, '')) + '</blockquote>'; continue; }
      const heading = line.match(/^(#{1,4})\s+(.*)$/);
      if(heading){ flushTable(); html += `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`; continue; }
      html += '<p>' + inline(line) + '</p>';
    }
    flushList(); flushTable();
    if(inCode) html += '</code></pre>';
    return html;
  }
  window.SimpleMarkdown = { parse };
})();
