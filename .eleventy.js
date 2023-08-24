const yaml = require("js-yaml");
const aml = require("archieml");
const marked = require('marked');








module.exports = function(eleventyConfig) {
  // Add a filter using the Config API

  eleventyConfig.addPassthroughCopy("templates/js");
  // eleventyConfig.addPassthroughCopy("templates/assets/fonts");
  // eleventyConfig.addPassthroughCopy("templates/assets/purpose");
  // eleventyConfig.addPassthroughCopy("templates/assets/journey");
  // eleventyConfig.addPassthroughCopy("templates/assets/video");
  // eleventyConfig.addPassthroughCopy("templates/assets/home");

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
      output: "_site"
    }
  };
};
