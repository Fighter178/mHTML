export default class mHTMLCompiler {
    private readonly customTags: {[key:string]:string} = {
      btn: 'button',
      vid: 'video',
      group: 'div',
      if: 'div',
      else: 'div',
      each:'div',
      inter:'div',
      first:'div',
      last:'div',
      await:'div',
      bq:"blockquote"
    };

    compile(html: string, findFrom:HTMLElement|Document = document, branding:boolean = true): string {
      const dom = this.parseHTML(html);
      let res: string[] = [];
      dom.childNodes.forEach((child) => {
        try {
          const compiled = this.compileNode(child, document);
          if (compiled !== 0) res.push(compiled);
        } catch (e) {
          console.error(`Firefly.js (mHTML compiler): ${e}\n\nError was ignored.`);
          console.debug(`Error debug:\n\nAt: compile: Current Variables: Result: ${JSON.stringify(res)}, dom: ${JSON.stringify(dom)}, child: ${JSON.stringify(child)}, html: ${html}`)
        }
      });
      let brandText = branding ? " <!-- Compiled mHTML (magical HTML). Compiled by Firefly.js Github: https://github.com/Fighter178/firelfy.js NPM: https://npmjs.com/firelfly.js -->" : "";
      return brandText + res.join('').trim();
    }
  
    private parseHTML(html: string): DocumentFragment {
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      return template.content;
    }
    // 0 is returned on halt. 
    private compileNode(node: Node | null, from:HTMLElement|Document): string|0 {
        const document = from;
        if (!node) {
          return '';
        }
      
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        }
      
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return '';
        }
      
        const el = node as Element;
        const customTag = el.tagName.toLocaleLowerCase();
        const tag = this.customTags[customTag] || customTag;
        if (customTag === "halt") {
          return 0;
        }
        if (customTag === "escape" || customTag === "esc") {
          return `<div class="fy-escape">${el.innerHTML}</div>`
        }
        if (customTag === "style") {
          let css = el.textContent||"";
          // Replace CSS selectors. Don't roast my code.
          css = this.compileCSS(css)
          return `<style>/* CSS might contain mHTML selectors. */  ${css} </style>`;
        }
        if (customTag === "first") {
          const result = this.compile(el.innerHTML, from);
          return this.compile(`<div class='fy-first'>${result}</div>`, from,false);
        }
        if (customTag === "last") {
          console.warn("Firefly.js (mHTML compiler) <last> is currently not supported. Try updating.");
          return this.compile(`<div class='fy-last'>${el.innerHTML}</div>`, from, false);
        }
        if (customTag === "await") {
          console.warn("Firefly.js (mHTML compiler) <await> is currently not supported. Try updating.");
          return "<div class='fy-await'></div>";
        }
        if (customTag === 'group' && el.hasAttribute('class') && el.getAttribute('class')?.split(' ').includes('group')) {
          return this.compile(`<div class="fy-group">${el.innerHTML}</div>`, from, false);
        }
      
        if (customTag === 'if') {
          const condition = new Function(`return ${el.getAttribute("c")}`)();
          const content = Array.from(el.childNodes).map((child) => this.compileNode(child, from)).join('');
          const elseContent = Array.from(el.children)
            .find((child) => child.tagName.toLowerCase() === 'else')
            ?.innerHTML;
          return this.compile(`<div class="fy-${condition ? "if" : "else"}">${condition ? content : elseContent || ''}</div>`,from, false);
        }
        if (customTag === "else") {
          return ""
        }
        if (customTag === "inter") {
          const vars:Record<string,string> = new Function(`return ${el.getAttribute("vars")||''}`)();
          
          return this.compile(`<div class="fy-inter">${this.interpolate(el.innerHTML, vars)}</div>`, from, false);
        }
      
        if (customTag === 'each' && el.hasAttribute('of')) {
          const array = new Function(`return ${el.getAttribute('of')}`)();
          const variableName:string = el.getAttribute('as')||"";
          const indexName = el.getAttribute('index') || '';
          let count = 0
          const content = array.map((item:any, index:number) => {
              const variables = {[variableName]: item, [indexName]: index};
              const innerHTML = Array.from(el.childNodes).map((child) => this.compileNode(child,from)).join('');
              const compiledHTML = this.interpolate(innerHTML, variables);
              count++
              return compiledHTML;
          }).join('');
          return this.compile(`<div class="fy-each" data-items='${count}'>${content}</div>`, from, false);
        }
      
        if (customTag === 'tooltip') {
          const content = Array.from(el.childNodes).map((child) => this.compileNode(child, from)).join('');
          const tooltipText = el.getAttribute('text') || '';
          const position = el.getAttribute('ps') || 'top';
          return this.compile(`
            <span class="fy-tooltip">
              <span class="fy-tooltip-text fy-pos-${position}">${tooltipText}</span>
              ${content}
            </span>
          `,from, false);
        }
        // Not working.
        // if (customTag === 'modal') {
        //   const content = Array.from(el.childNodes).map((child) => this.compileNode(child, from)).join('');
        //   const modalId = el.getAttribute('id') || '';
        //   const triggerText = el.getAttribute('trigger-text') || '';
        //   return `
        //     <div>
        //       <button onclick="${from}.getElementById('${modalId}').style.display='block'">${triggerText}</button>
        //       <div id="${modalId}" class="modal">
        //         <div class="modal-content">
        //           <span onclick="${from}.getElementById('${modalId}').style.display='none'" class="close">&times;</span>
        //           ${content}
        //         </div>
        //       </div>
        //     </div>
        //   `;
        // }
      
        const attributes = this.compileAttributes(el);
        const children = Array.from(el.childNodes)
          .map((child) => this.compileNode(child, from))
          .join('');
        return `<${tag}${attributes}>${children}</${tag}>`;
      }
      
  
    private compileAttributes(el: Element): string {
      return Array.from(el.attributes)
        .map((attribute) => ` ${attribute.name}="${attribute.value}"`)
        .join('');
    }
    private interpolate(html:string,variables:Record<string,string>) {
        let resHTML = html
        const regex = new RegExp("\{[^}]*\}", 'g');
        let keys:string[] = [];
        let values:string[] = [];
        for(const k in variables) {
          keys.push(k);
          values.push(variables[k]);
        }
        Array.from(resHTML.matchAll(regex))?.forEach((m)=>{
          const match = m.toString();
          const js =  match.substring(1, match.lastIndexOf("}"));
         
          resHTML =  resHTML.replaceAll( `{${js}}`, new Function(...keys, `return ${js}`)(...values));
        });

        return resHTML;
    }
    /** Replaces mHTML selectors with their compiled equivalents. */
    compileCSS(css:string) {
      css = css
        // This was easier than creating a function to pass the new css each time. 
        .replaceSelector("escape", "div.fy-escape")
        .replaceSelector("esc", "div.fy-escape")
        .replaceSelector("first", "div.fy-first")
        .replaceSelector("last", "div.fy-last")
        .replaceSelector("await", "div.fy-await")
        .replaceSelector("group", "div-fy-group")
        .replaceSelector("if", "div.fy-if")
        .replaceSelector("else", "div.fy-else")
        .replaceSelector("inter", "div.fy-inter")
        .replaceSelector("each", "div-fy-each")
        .replaceSelector("tooltip", "fy-tooltip")
      return `\n/* CSS contains mHTML selectors. Compiled by Firefly.js */${css}\n`.trim().replaceAll("\n","")

    }
    /* adds default css for the compiled page. Includes CSS for the tooltip element. */
    addDefaultCSS(html:string):string { 
      html += /*html*/`
      <style>
          /* Tooltip CSS */
          .fy-tooltip {
              display:none;
              background:#363738;
              color:white;
              width:max-content;
              padding:8px;
              border-radius:0.15rem;
              position:absolute;
              margin-top:2px;
          }
          .fy-tooltip:hover {
              cursor:default;
          }
          *:has(.fy-tooltip):hover .fy-tooltip{
              display:block;
          }
          *:has(.fy-tooltip) {
              width:fit-content;
              position:relative
          }
          button {
            background:#363738;
            padding:8px;
            border-radius:0.15rem;
            color:white;
            border:none;
            font-family: Calibri, 'Trebuchet MS', sans-serif;
            font-weight:550;
            font-size:1.075em;
          }
        </style>
      `;
      return html
    }
  }

  const replaceSelector = (css: string, oldSelector: string, newSelector: string): string => {
    // Split the CSS into individual rules
    const rules = css.split('}');
    
    // Loop through each rule and replace the old selector with the new selector
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      
      // Check if the rule contains the old selector
      if (rule.includes(oldSelector)) {
        // Replace the old selector with the new selector
        const newRule = rule.replace(oldSelector, newSelector);
        
        // Replace the old rule with the new rule
        rules[i] = newRule;
      }
    }
    
    // Join the rules back together and return the modified CSS
    return rules.join('}');
  }
  String.prototype.replaceSelector = function(oldSelector, newSelector){
    return replaceSelector(this.toString(), oldSelector, newSelector);
    
  }
  declare global {
    interface String {
    /** Replaces a CSS selector in the string with the new one. */
    replaceSelector:(oldSelector:string, newSelector:string)=>string
  }
}
  