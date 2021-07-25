module.exports = function(eleventyConfig) {
  // Add a filter using the Config API

  eleventyConfig.addPassthroughCopy("templates/js"); 

  eleventyConfig.addFilter( "myFilter", function() {});
  eleventyConfig.setTemplateFormats("html,css,njk,ttf");



  // You can return your Config object (optional).
  return {
    dir: {
      input: "templates",
      output: "_site"
    }
  };
};
