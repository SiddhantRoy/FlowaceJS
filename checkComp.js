describe('Check introduced date', function() {
    it('Amiga500 is 1987-01-1', function() {
    	
    	browser.waitForAngularEnabled(false);
      browser.get('http://computer-database.herokuapp.com/computers');

      //search amiga500
      element(by.id('searchbox')).sendKeys("Amiga 500");
      
      browser.driver.sleep(5000);
      //click
      element(by.id('searchsubmit')).click();

      browser.driver.sleep(5000);
      //introduce date of amiga 500
      var date=element(by.xpath("//td[contains(text(),'01 Jan 1987')]"));
      expect(date.getText()).toEqual('01 Jan 1987');
           
    });
});