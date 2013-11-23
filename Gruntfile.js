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
    },
    uglify: {
      all: {
        files: {
          'dist/grande.min.js': ['js/grande.js']
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-qunit-istanbul");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  // @TODO: add lint hook here as well for eslint
  grunt.registerTask("travis", "qunit");
};

