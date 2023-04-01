# mHTML
mHTMl: Magical HTML.
mHTML is used in libraries like [Firefly.js](https://npmjs.com/firefly.js), to add extra synatx on top of HTML.
mHTML is a HTML preprocessor/compiler, which keeps the general feel of HTML, but empowers it with conditional statements, loops, etc, that compile down to regular HTML. mHTML's compiler doesn't provide support for outside variables, but that isn't a problem, as monst times, a template literal will be used to input the compiled code. 

## Elements
mHTML provides a number of extra elements to HTML. 

`<if>` - Renders content conditionally based on the `c` attribute. Accepts variables.

`<else>` - Must be a child of `<if>`, and will render content when the parent if element is false.
Usage:
```html
<if c="1+2===3">
    <p>1+2 is 3!</p>
    <else>
        I don't think 1+2 is 3. 
    </else>
</if>
```
Note: I don't like this syntax all that much, and it will probably change in the future. Probably to make `<else>` a immediate sibling of `<if>` instaed of a child.
Note 2: When compiled, if the element is false, and no else is supplied, then _nothing_ is outputted to the final build. So, JavaScript cannot access it.

`<each>` - Loops over an array from the `of` attribute. Arribute `as` allows you to assign a variable name to the value, and `index` allows you to assing a variable name to the current index. `<each>` requires an `of` attribute to compile.
Usage: 
```html
<each of="[1,2,3]" as="num", index="i">
    <p>Number: {num}, index: [i}</p>
</each>
```
Note, these are variables, so can be used in all ways varialbes can be used.

`<inter>` - Allows for interpolating variables when not automatically required. `<each>` interpolates automatically. Accessing variables not defined in the `<inter>` element will return undefined. 
Usage: 
```html
<inter vars='{name:"value", btn:"button", color:"red", user:{name:'Bob'}}'>
    <p>Anywhere inside this element, attributes can be accessed like so: {name}</p>
    Even like this:
    <{btn}>I'll be a button!</{btn}>
    Or this:
    <p style="color:{color}">This is red text!</p>
    And, you can run JS on it as well.
    <h2>1+2 is {1+2}!</h2>
    Or access properties...
    <h2>Hello {user.name}!</h2>
    Really, there is little you can't do. 
</inter>
```
* **note**: It is generally reccomnended to use single quotes (') when declaring attributes in mHTML. This is because of the way the compiler works, it may add double quotes to attributes, ending the attribute, and causing an error.

`<halt>` - This element and all following elements aren't compiled, or outputted into the final build. Can be disabled with compile option, allowHalt set to false. Useful for debugging. Not reccomended to allow halt in production.
Usage: 
```html
<if c="true">
    <p>I am in the final build.</p>
</if>
<halt></halt>
<div>
    <p>I am not gonna be in the compiled output.</p>
    <each of="[1,2,3]">
        <p>And I won't be compiled at all!</p>
    </each>
    <if c="true">
        <p>Nor I, even though I am true!</p>
    </if>
</div>
```

`<tooltip>` - Specifies a tooltip. When default CSS is added, with `mHTMLCompiler.addDefualtCSS`, this appears on hover, however, this is not added by default. This CSS uses `:has`, which currently is supported by most modern browsers, except Firefox, which requires a config flag change.
### Shorthand Elements
`<btn>` - Equivelent to HTML `<btn>` element.

`<vid>` - Equivelent to HTML `<video>` element.

`<bq>` - Equivelent to HTML `<blockquote>` element.

## Variables
Variables, when compiled, become their value. 
HTML, and by extension, JavaScript, doesn't know that there is a varialbe there.
Variables can be automatically added by certain elements, namely `<each>`. Or, you can add them with `<inter>`. See `<inter>` for how to do that.
Variables can be accessed by the brace syntax, where braces ({}) encapsulate Javascript to run. Inside these braces, variables are passed to make them accessable. Then, at compile time, this is ran, and the braces and whatever is inside them is replaced with the result of the Javascript. Since mHTML is compiled to pure HTML (and some CSS), no Javascript is ran after compile. Braces are executed at _compile_ time, not _runtime_.

## CSS
When mHTML encounters a `<style>` element, it will analyze its content, find mHTML element selectors, and replace them with their compiled equivelemnts so CSS will work. 
This does not change normal selectors, and only the part of the selector that has the mHTML element will be affected.
### Adding default CSS
Add default CSS with this code: 
```ts
const compiler = new mHTMLCompiler();
// mHTML or HTML code here
let mHTML = ``;
mHTML = compiler.addDefaultCSS(mHTML);
```
This creates a <style> element at the end of the page, which styles mHTML elements. 
This does `not` compile the CSS, which doesn't require compilation. This simply adds a style element to the code with basic css for `<tooltip>` and other elements.
## Using the compiler
   Include the script tag (coming to NPM soon, currently just clone this repo), and add this
   ```ts
   import mHTMLCompiler from "path/to/file/here";
   const compiler =  new mHTMLCompiler();
   ```
   ### Compiling a string
   ```ts
       const compiled = compiler.compile("string here", ignoreThisArg, branding?, allowHalt?);
       // compiled is compiled mHTML. Add to document.
   ```
   ### Compiling CSS
   Compiles CSS so that way selectors point to compiled selectors. `compile` does this internally.
   ```ts
   const css = compiler.compileCSS("css-containing-mhtml-selectors-here");
   ```
   ### Adding Default CSS
   Adds default css for elements such as `<tooltip>` to the output. Wrap this around `compile` if used..
   ```ts
   const css = compiler.addDefaultCSS("html-to-add-to")
   ```
  And there you go. Learn mHTML, and you'll never go back.
