
 var HtmlReporter = require('protractor-beautiful-reporter');


exports.config = {
  framework: 'jasmine',
    // The address of a running selenium server.
    seleniumAddress: 'http://localhost:4444/wd/hub',

// Spec patterns are relative to the configuration file location passed
    // to protractor (in this example conf.js).
    // They may include glob patterns.
    specs: ['Project.js'],
    
    onPrepare: function() {
        // Add a screenshot reporter and store screenshots to `/tmp/screenshots`:
        jasmine.getEnv().addReporter(new HtmlReporter({
           baseDirectory: 'Report/screenshots'
        }).getJasmine2Reporter());
    }
    
};
    
    
    
    
  
    