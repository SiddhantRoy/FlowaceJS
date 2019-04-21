describe('Delete Computer', function() {
    it('Apple I', function() {
    	
    	browser.waitForAngularEnabled(false);
      browser.get('http://computer-database.herokuapp.com/computers');

      //search Apple I
      element(by.id('searchbox')).sendKeys('Apple I');
      element(by.id('searchsubmit')).click();
      
      browser.driver.sleep(5000);
      //click the Apple I
      element(by.linkText('Apple I')).click();
      
      
      browser.driver.sleep(5000);

      //Delete apple I
      element(by.className('btn danger')).click();

      //delete message shoukld display
      var del=element(by.className('alert-message warning'));
      expect(del.getText()).toEqual('Done! Computer has been deleted');
      

      
    });
});