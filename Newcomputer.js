describe('Add a new computer Name', function() {
    it('Dell Windows10, Year 2019 and check the feature', function() {
        browser.waitForAngularEnabled(false);
      browser.get('http://computer-database.herokuapp.com/computers');

      
      //click Add computer button
      element(by.className('btn success')).click();
      
      ////write computer name
        element(by.id('name')).sendKeys('Dell Windows10');
    //Date
    element(by.id('introduced')).sendKeys('2019-1-14');
    
        browser.driver.sleep(5000);
    //Submit
    element(by.xpath('//input[@value="Create this computer"]')).click();

    //expected
    var warningmsg=element(by.className('alert-message warning'));

    //assertion
    expect(warningmsg.getText()).toEqual('Done! Computer Dell Windows10 has been created');
    });
  });
  