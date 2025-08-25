//Import All your page objects here
const { firstPage } = require('./firstPage');

class poManager {
    //Constructor to initialize the page objects
    //Declare the page instance variable as a parameter in the constructor
    //The testInfo parameter is used to get the test information such as the project name and use information
    
    constructor(page) {
        //Assign the page instance variable to the page parameter
        this.page = page;
        this.firstPage = new firstPage(this.page); 
    }

    //Getters for each page object
    getFirstPage() {
        return this.firstPage; //Return the login page object
    }
}

module.exports = { poManager }; //Export the POManager class to be used in other files (Test files)