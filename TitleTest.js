describe('Check the title has the expected', function() {
    it('should have a title', function() {
        browser.waitForAngularEnabled(false);
      browser.get('http://computer-database.herokuapp.com/computers');
 var ele= element(by.partialLinkText('Play sample application — '));
      expect(ele.getText()).toEqual('Play sample application — Computer database');
    });
  });