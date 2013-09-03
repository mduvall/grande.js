module.exports = function(grunt) {

  grunt.initConfig({
    qunit: {
      options: {
        "--web-security": "no",
        coverage: {
          src: ["js/grande.js"],
          instrumentedFiles: "temp/",
          htmlReport: "report/coverage",
          coberturaReport: "report/",
          linesThresholdPct: 85
        }
      },
      all: ["test/**.html"]
    }
  });

  grunt.loadNpmTasks("grunt-qunit-istanbul");
};

