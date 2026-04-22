const aml = require("archieml");
const marked = require('marked');
const nunjucks = require("nunjucks");
const path = require("path");

console.log('hello hello eleventy config')

module.exports = function(eleventyConfig) {

  const nunjucksEnv = new nunjucks.Environment(
    new nunjucks.FileSystemLoader([
      path.resolve(__dirname, "templates/_includes"),
    ])
  );
  eleventyConfig.setLibrary("njk", nunjucksEnv);
  

  eleventyConfig.addPassthroughCopy("templates/js");
  eleventyConfig.addPassthroughCopy({"sveltekit/_build/": "." });



  // eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
  
  // eleventyConfig.addPassthroughCopy({"sveltekit/_build/_app": "_app" });
  // eleventyConfig.addPassthroughCopy({"sveltekit/_build/arena/channel": "arena/channel" });
  

  // "sveltekit/build/_app": "_app" 


  

  eleventyConfig.addFilter( "myFilter", function() {});
  eleventyConfig.setTemplateFormats("html,css,js,njk,otf,woff,woff2,md,vtt,gif");

  eleventyConfig.addNunjucksFilter( "findwhere", function(value,data,key) {
    return data.find(a=>a[key]==value);
  });



  eleventyConfig.addNunjucksFilter( "footnotes", function(value) {
    var result;


    return value.replace(/\{(.*?)\}\((.*?)\)/g,function(str){
      const reg=/\{(.*?)\}\((.*?)\)/;
      const matches=reg.exec(str);
      const id=matches[2].split('-');


      return `<span class='footnote-link' data-id="${id[0]}" data-type="${id[1]}">${matches[1]}</span>`;
    })

  });

  eleventyConfig.addNunjucksFilter( "md", function(value) {
    var result;
      try {
        result = marked.parse(value);
        return result;
      } catch (e) {
        console.log(e)
        return e;
      }
  });

  eleventyConfig.addDataExtension("aml", contents => aml.load(contents));

  // You can return your Config object (optional).
  return {
    dir: {
      input: "templates",
      includes:"_includes",
      output: "_site"
    }
  };
};
