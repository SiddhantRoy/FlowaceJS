describe('Play sample application — Computer database', function() {
	
//Golbal avriable
	browser.waitForAngularEnabled(false);
	browser.manage().timeouts().implicitlyWait(50000);
	
	//this is searchbox xpath
	var search=element(by.id('searchbox'));
	//this is submit
	var submit=element(by.id('searchsubmit'));
	
	//This will be called before running each spec
    beforeEach(function() {
	browser.get('http://computer-database.herokuapp.com/computers');
	});
    
 //TC-1: Check the title has the expected should have a title
    it('Check the title has the expected should have a title', function() {
    	 var ele= element(by.partialLinkText('Play sample application — '));
         expect(ele.getText()).toEqual('Play sample application — Computer database');
       });
    
 //TC=2: Add a new computer Name Dell Windows10, Year 2019 and check the feature
    it('Dell Windows10, Year 2019 and check the feature', function() {
    	
    	//click Add computer button
        element(by.className('btn success')).click();
        
       //write computer name
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

    
//TC:3 : Check introduced date Amiga500 is 1987-01-1
    it('Amiga500 is 1987-01-1', function() {
    	
    	search.sendKeys("Amiga 500");
        
        //click
        submit.click();

        //introduce date of amiga 500
        var date=element(by.xpath("//td[contains(text(),'01 Jan 1987')]"));
        expect(date.getText()).toEqual('01 Jan 1987');
             
      });
    
    
 //TC4 : Delete Computer Apple I
    it('Delete Computer Apple I', function() {
    	
    	 //search Apple I
    	search.sendKeys('Apple I');
        submit.click();
        
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
    
    afterEach(function() {
        console.log("Testcase1 ");
       
    });
    
    afterEach(function() {
        console.log("Testcase2 ");
       
    });
    
    afterEach(function() {
        console.log("Testcase3 ");
       
    });
    
    afterEach(function() {
        console.log("Testcase4 ");
       
    });
});