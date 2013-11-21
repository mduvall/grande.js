module.exports = function(grunt) {

  grunt.initConfig({
    qunit: {
      options: {
        "--web-security": "no",
        coverage: {
          src: ["js/grande.js"],
          instrumentedFiles: "temp/",
          htmlReport: "report/coverage",
          coberturaReport: "report/"
        }
      },
      all: ["test/**.html"]
    }
  });

  grunt.loadNpmTasks("grunt-qunit-istanbul");
  // @TODO: add lint hook here as well for eslint
  grunt.registerTask("travis", "qunit");
};

