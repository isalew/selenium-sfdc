'use strict';
/******************************* SFDC Extension *******************************/

/**
 * Data-Driven Testing for Salesforce using the Selenium IDE and SFDC REST APIs
 * @name    selenium-sfdc
 * @author  Isaac Lewis <isajlew@gmail.com>
 * @created 2016-05-14
 * @see     [README.md](../README.md)
 * @license [MIT License](../LICENSE)
 */

var sfdc = {
  name : "sfdc",
  globalScope : this,
  api: {},
  ui: {},
  util: {},
  data: {}
};

/**
 * Specifier for Selenium in methods (to keep track of 'this')
 */
// SPRINT:10 Swap for sfdc.globalScope
var selbot;

// =============================================================================
// Jasmine Mock Testing Placeholders

var Selenium = Selenium || function Selenium(){
  browserbot : Selenium.BrowserBot || {};
};
var storedVars = storedVars || {};
var LOG = LOG || {
  debug : function(){},
  error : function(){}
};

// =============================================================================
// sfdc namespace

// Logging Wrapper
// from: `selblocks user-extensions.js` > `data-reader.js`
(function($$){

  function Logger () {
    this.error = function (msg) { this.logit("error", msg); };
    this.warn  = function (msg) { this.logit("warn", msg); };
    this.info  = function (msg) { this.logit("info", msg); };
    this.debug = function (msg) { this.logit("debug", msg); };
    this.trace = function (msg) { this.logit("debug", msg); }; // Selenium doesn't have trace level

    this.logit = function (logLevel, msg) {
      LOG[logLevel]("[" + sfdc.name + "] " + msg);  // call the Selenium logger
    };

    // ==================== Stack Tracer ====================

    this.genStackTrace = function (err) {
      var e = err || new Error();
      var stackTrace = [];
      if (!e.stack) {
        stackTrace.push("No stack trace, (Firefox only)");
      } else {
        var funcCallPattern = /^\s*[A-Za-z0-9\-_\$]+\(/;
        var lines = e.stack.split("\n");
        for (var i=0; i < lines.length; i++) {
          if (lines[i].match(funcCallPattern)) {
            stackTrace.push(lines[i]);
          }
        }
        if (!err) {
          stackTrace.shift(); // remove the call to genStackTrace() itself
        }
      }
      return stackTrace;
    };

    this.logStackTrace = function (err) {
      var t = this.genStackTrace(err);
      if (!err) {
        t.shift(); // remove the call to logStackTrace() itself
      }
      this.warn("__Stack Trace__");
      for (var i = 0; i < t.length; i++) {
        this.warn("@@ " + t[i]);
      }
    };

    // describe the calling function
    this.descCaller = function () {
      var t = this.genStackTrace(new Error());
      if (t.length == 0) return "no client function";
      t.shift(); // remove the call to descCaller() itself
      if (t.length == 0) return "no caller function";
      t.shift(); // remove the call to client function
      if (t.length == 0) return "undefined caller function";
      return "caller: " + t[0];
    };
  }

  $$.LOG = new Logger();

})(sfdc);

// =============================================================================
// sfdc.api namespace

// Core API
(function($$){

  /**
   * Version of endpoint being used for the SFDC REST API
   * @type {String}
   */
  $$.VERSION = 'v36.0';
  /**
   * List of endpoints accessible in the SFDC REST API
   * @type {Object}
   */
  $$.ENDPOINTS = {
    "oAuth" : "/services/oauth2/token",
    "query" : "/services/data/" + $$.VERSION + "/query/",
    "sobjects" : "/services/data/" + $$.VERSION + "/sobjects/",
    "tooling" : "/services/data/" + $$.VERSION + "/tooling/"
  };
  $$.SESSION = {};
  /**
   * Parameters required for authorization into the SFDC REST API
   * @param {String}  grant_type    password to allow for user authentication
   * @param {String}  client_id     consumer key from connected app
   * @param {String}  client_secret consumer secret from connected app
   * @param {String}  username      email passed for user authentication
   * @param {String}  password      password passed for user authentication
   * @type {Object}
   */
  $$.SESSION.oAuth = {
    "grant_type" : 'password',
    "client_id" : '',
    "client_secret" : '',
    "username" : '',
    "password" : ''
  };
  $$.SESSION.instanceUrl = '';
  $$.SESSION.accessToken = '';

  /**
   * Authenticates into the Salesforce REST API based on a specified connected app and user
   * @param  {String} username       SFDC username of user (should be an admin)
   * @param  {String} password_token SFDC password and security token
   * @env    {String} client_id      Client Id for Connected App (set in Selenium)
   * @env    {String} client_secret  Client Secret for Connected App (set in Selenium)
   * @return {Object}                JSON object with authentication details
   */
  // SPRINT:0 Swap LOG functions for $$.LOG functions
  $$.login = function (username,password_token) {
    LOG.debug('in $$.login');
    var url = 'https://login.salesforce.com' + $$.ENDPOINTS.oAuth;
    $$.SESSION.oAuth.client_id = storedVars['client_id'];
    $$.SESSION.oAuth.client_secret = storedVars['client_secret'];
    $$.SESSION.oAuth.username = username;
    $$.SESSION.oAuth.password = password_token;
    LOG.debug('Authorization Params: ' + JSON.stringify($$.SESSION.oAuth));
    var params = sfdc.util.encodeParams($$.SESSION.oAuth);
    var response = $$.callout("POST",url,params);
    sfdc.data.login = response;
    sfdc.data.instance_url = response.instance_url;
    sfdc.data.access_token = response.access_token;
    return response;
  };

  $$.query = function (query) {
    LOG.debug('in $$.query');
    var params = '?q=' + encodeURIComponent(query);
    var url = storedVars['instance_url'] + $$.ENDPOINTS.query + params;
    LOG.debug('query url: ' + url);
    var response = $$.callout("GET",url);
    return response;
  };

  $$.queryTooling = function (query) {
    LOG.debug('in $$.queryTooling');
    var params = 'query/?q='+encodeURIComponent(query);
    var url = storedVars['instance_url'] + $$.ENDPOINTS.tooling + params;
    var response = $$.callout("GET",url);
    return response;
  }

  $$.describeSObject = function (sObjectName) {
    LOG.debug('in $$.describeSObject');
    var params = encodeURIComponent(sObjectName) + '/describe/';
    var url = storedVars['instance_url'] + $$.ENDPOINTS.sobjects + params;
    var response = $$.callout("GET",url);
    return response;
  }

  $$.runTestsSynchronous = function (classNames) {
    LOG.debug('in $$.runTestsSynchronous');
    var params = 'runTestsSynchronous/?classnames=' + encodeURIComponent(classNames);
    var url = storedVars['instance_url'] + $$.ENDPOINTS.tooling + params;
    var response = $$.callout("GET",url);
    return response;
  }

  /**
   * Feeds username and password with connected app credentials to provide an oAuth token for future REST calls
   * @param  {String} username Salesforce username (Named `target` in Selenium)
   * @param  {String} password Salesforce password + security token (Named `value` in Selenium)
   * @return {Object}          JSON response with authorization token
   */
  Selenium.prototype.doSfdcLoginAPI = function (username, password) {
    selbot = this;
    var response = $$.login(username,password);
    storedVars['login'] = response;
    storedVars['instance_url'] = response.instance_url;
    storedVars['access_token'] = response.access_token;
  };

  /**
   * Performs a standard SOQL record query in Salesforce
   * @param  {String} query        SOQL Query Definition
   * @param  {String} variableName Selenium variable to contain results
   * @return {Object}              JSON list of returned records
   */
  Selenium.prototype.doSfdcQuerySOQL = function (query, variableName) {
    selbot = this;
    var response = $$.query(query);
    storedVars[variableName] = response.records;
  };

  /**
   * Performs a SOQL tooling metadata query in Salesforce
   * @param  {String} query        SOQL Query Definition
   * @param  {String} variableName Selenium variable to contain results
   * @return {Object}              JSON list of returned records
   */
  Selenium.prototype.doSfdcQueryTooling = function (query, variableName) {
    selbot = this;
    var response = $$.queryTooling(query);
    storedVars[variableName] = response.records;
  };

  /**
   * Retrieves results of a full sObject describe
   * @param  {String} sObjectName  Developer name of sObject
   * @param  {String} variableName Selenium variable to contain results
   * @return {Object}              JSON object of returned describe results
   */
  Selenium.prototype.doSfdcDescribeSObject = function (sObjectName, variableName) {
      selbot = this;
      var response = $$.describeSObject(sObjectName);
      storedVars[variableName] = response;
  }

  /**
   * Runs Apex test classes synchronously
   * @param  {String} classNames   Comma-separated list of test classes
   * @param  {String} variableName Selenium variable to contain results
   * @return {Object}              JSON test results
   */
  Selenium.prototype.doSfdcRunTests = function (classNames, variableName) {
    selbot = this;
    var response = $$.runTestsSynchronous(classNames);
    storedVars[variableName] = response;
  }

  Selenium.prototype.doSfdcGetFields = function (parameters, variableName) {

    var params = JSON.parse(parameters);
    LOG.debug('Params: ' + JSON.stringify(params));
    var fields;

    // "layoutName":"Account Layout"

    if (!params.sObjectName) {
      throw Error ('No sObject for Query');
    } else if (params.sObjectName && !params.layoutName) {
      fields = $$.getSObjectFields(params.sObjectName);
    } else if (params.sObjectName && params.layoutName) {
      fields = $$.getSObjectLayoutFields(params.sObjectName, params.layoutName);
    }

    sfdc.model.fields[params.sObjectName] = fields;

    if (variableName) {
      storedVars[variableName] = fields;
    }

  }

  /**
   * Wrapper for XMLHttpRequest with default headers for Salesforce requests
   * @see    $$.ENDPOINTS.oAuth
   * @param  {String} method HTTP request method (Supported: GET, POST)
   * @param  {String} url    HTTP request endpoint (with parameters for GET)
   * @param  {Object} body   HTTP request body in JSON format (for POST)
   * @return {Object}        HTTP responseText in JSON format
   */
  // TODO:50 convert to object with `function Callout (method,url,body) {}`
  $$.callout = function (method,url,body) {

    var response;
    var request = new XMLHttpRequest();

    request.open(method,url,false);
    request.setRequestHeader("Accept","application/json");

    if (method == "POST") {
      request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    }
    if (url.indexOf($$.ENDPOINTS.oAuth) == -1) {
      request.setRequestHeader('Authorization','OAuth ' + storedVars['access_token']);
    }

    // LOG.debug('HTTP request: ' + JSON.stringify(request));
    if (body) {
      request.send(body);
    } else {
      request.send();
    }

    if (request.status == 200) {
      if(typeof request.responseText == "string") {
        response = JSON.parse(request.responseText);
      } else if (typeof request.responseText == "object") {
        response = request.responseText
      } else {
        throw new Error('Improper response format');
      }
    } else {
      LOG.error(request.responseText);
    }
    // LOG.debug('HTTP response: ' + JSON.stringify(response));
    return response;

  };

  // TODO:20 Move this function here as a "new" object?
  function encodeParams () {

  }

})(sfdc.api);

// Extended API
// High-level calls for specific requests
(function($$){

  /**
   * Uses Tooling API to pull fields for a given sObject
   * @param  {String} sObjectName API name for sObject
   * @return {Array}             List of field data in JSON format
   */
  $$.getSObjectFields = function (sObjectName) {
    if(!sObjectName) {
      throw new Error("No sObject for query");
    }
    var query = "SELECT Id, DeveloperName, TableEnumOrId FROM CustomField WHERE TableEnumOrId = '" + sObjectName + "'";
    var fields = $$.queryTooling(query).records;
    LOG.debug(sObjectName + ' Fields: ' + JSON.stringify(fields));
    return fields;
  };

  /**
   * Uses Tooling API to pull fields for a given sObject, then filters to only include fields from a given page layout
   * @param  {String} sObjectName API name for sObject
   * @param  {String} layoutName  Full name for sObject page layout
   * @return {Array}             List of field data in JSON format
   */
  $$.getSObjectLayoutFields = function (sObjectName, layoutName) {

    var objectFields = $$.getSObjectFields(sObjectName);

    var query = "SELECT Metadata, Name, TableEnumOrId FROM Layout WHERE TableEnumOrId = '" + sObjectName + "' AND Name LIKE '%" + layoutName + "%' LIMIT 1";
    var layout = $$.queryTooling(query).records[0];
    LOG.debug('Layout Name: ' + layout.Name);

    var layoutFields = [];
    layout.Metadata.layoutSections.forEach(function(layoutSection){
      layoutSection.layoutColumns.forEach(function(layoutColumn){
        layoutColumn.layoutItems.forEach(function(layoutItem){
          if(layoutItem.field){
            layoutFields.push(layoutItem.field);
          }
        });
      });
    });
    LOG.debug('Layout Field Names: ' + layoutFields);

    var fields = objectFields.filter(function(record){
      LOG.debug('Object Field Name: ' + record.developerName);
      LOG.debug('Layout Field Name: ' + layoutFields.indexOf(record.developerName));
      return (layoutFields.indexOf(record.developerName) != -1);
    });
    LOG.debug('Layout Field Data: ' + fields);

    return fields;

  }

  $$.getSObjectFromId = function (Id) {
    return $$.queryTooling("SELECT Id, DurableId, DeveloperName, Label FROM EntityDefinition WHERE KeyPrefix = '" + Id.substring(0,3) + "' LIMIT 1").records[0];
  }

  Selenium.prototype.doSfdcGetFields = function () {};

})(sfdc.api);

// =============================================================================
// sfdc.ui namespace

(function($$){

  $$.selectors = {};
  $$.selectors.aloha = {};
  $$.selectors.lightning = {};

  $$.getFieldIdsFromEditPage = function (fieldLabelArray) {

    // This only returns one element: selbot.page().findElement('form#editPage label');
    var labels = selbot.browserbot.getUserWindow().document.querySelectorAll("form#editPage label");
    var labelMatch = /<label for=\"(.*?)\">(.*?)<\/label>/i;
    var response = {};

    if (labels.lengh == 0) {
      return response;
    }

    for (var i = 0; i < labels.length; i++) {
      var dirtyString = labels[i].outerHTML;
      var labelString = dirtyString.replace(/<span.*span>/,"");
      var labelParse = labelMatch.exec(labelString);
      var fieldId = labelParse[1];
      var fieldLabel = labelParse[2];
      response[fieldLabel] = fieldId;
    }
    return response;

  }

  $$.getIdFromLocation = function(location) {
    var pathname = location.pathname;
    var idMatch = /[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}/g;
    var arr = idMatch.exec(pathname);
    if (arr.length > 0) {
      return arr[0];
    } else {
      throw new Error("Id could not be extracted from window.location");
    }
  }

  // TODO:10 Fix this command
  Selenium.prototype.doSfdcCaptureScreenshotPDF = function(fileLocation,fileName) {
    selbot = this;

    // sfdc.util.printObject(window.editor.seleniumAPI,true);
    // sfdc.util.insertWaitCommand();
    sfdc.util.insertCommand('pause','5000');

    LOG.warn('in doSfdcCaptureScreenshotPDF after wait command');
    // Set to display entire page on screen
    selbot.doSelect('//div[@class="toolbar"]//select','id=pageFitOption');
    var pageNumber = selbot.browserbot.getUserWindow().document.getElementById('pageNumber');
    var pageCount = pageNumber.getAttribute("max");
    var pageIdx = pageNumber.getAttribute("value");
    // LOG.warn('pageCount: ' + pageCount);
    // LOG.warn('pageIdx: ' + pageIdx);

    for(var i=pageIdx;i<=pageCount;i++){
        // LOG.warn('pageCount Loop: ' + i);
        var timeStamp = sfdc.util.getTimestamp();
        var pageName = timeStamp + ' - ' + fileName + ' - Page ' + i + ' of ' + pageCount;
        var fullLocation = fileLocation + '/' + pageName + '.jpg';
        // LOG.warn(fullLocation);
        // selbot.doCaptureEntirePageScreenshot(fullLocation);
        selbot.doClick('//div[@class=\"toolbar\"]//button[@id=\"next\"]');
        // selbot.doWaitForElementPresent('//div[@class=\"page\" and @data-page-number=\"'+i+'\" and @data-loaded=\"true\"]');
        // var delay = function (time) {
        //   var d1 = new Date();
        //   var d2 = new Date();
        //   while(d2.valueOf() < d1.valueOf() + time){
        //     d2 = new Date();
        //   }
        // };
        // htmlTestRunner.currentTest.pauseInterval = 5000;
        // delay(5000);

        // do {
        //   var loadingIcon = selbot.browserbot.getUserWindow().document.getElementById('pageNumber').getAttribute("class");
        //   var loadingMatcher = /^(?:(?!visiblePageIsLoading).)*$/;
        //   var result = loadingIcon.match(loadingMatcher);
        // } while (!result);
        // selbot.WaitForNotAttribute('//div[@class=\"toolbar\"]//input[@id=\"pageNumber\"]@class','regexp:.*visiblePageIsLoading.*');
    }

  }

  /**
   * Opens a page in Salesforce by name (Login, Home, Setup) or record id (15 or 18 digit)
   * @param  {String} param   Page name or record Id to be opened
   */
  Selenium.prototype.doSfdcOpenPage = function (param) {

    selbot = this;

    var url = sfdc.data.instance_url + '/';

    if (param === 'Login') {
      url = 'https://login.salesforce.com';
    } else if (param === 'Home') {
      url += 'home/home.jsp';
    } else if (param === 'Setup') {
      url += 'setup/forcecomHomepage.apexp';
    } else if(sfdc.util.isValidId(param)){
      selbot.doSfdcOpenRecordById(param);
      return;
    } else {
      throw new Error("Page is not supported with this function");
    }

    LOG.debug('Opening ' + url);
    selbot.doOpen(url);

  };

  /**
   * Opens a Salesforce record page by Id
   * @param  {Id} recordId 15 or 18 digit Salesforce record Id
   */
  Selenium.prototype.doSfdcOpenRecordById = function (recordId) {

      selbot = this;
      var url = sfdc.data.instance_url + '/';

      if(sfdc.util.isValidId(recordId)){
        url = url + recordId;

        // Navigate to user detail page, not chatter profile
        if(recordId.startsWith('005')){
          url = url + '?noredirect=1';
        }

      }

      LOG.debug('Opening: ' + url);
      selbot.doOpen(url);

  };

  /**
   * Completes and submits login page form
   * @param  {String} username SFDC username
   * @param  {String} password SFDC password
   */
  Selenium.prototype.doSfdcLogin = function (username, password) {

    selbot = this;
    var fUsername, fPassword, bLogin;

    // window.location = storedVars['instance_url'];

    try {
      fUsername = selbot.page().findElement('id=username');
      fPassword = selbot.page().findElement('id=password');
      // bLogin = selbot.page().findElement('id=Login');
    }
    catch (error) {
      LOG.error(error);
      return;
    }

    selbot.page().replaceText(fUsername, username);
    selbot.page().replaceText(fPassword, password);
    // selbot.doCaptureEntirePageScreenshot('test');
    selbot.doClick('id=Login');

  }

  /**
   * Clicks the "login" button when viewing a user detail page
   */
  Selenium.prototype.doSfdcLoginAsUser = function () {
    selbot = this;
    selbot.doClick('name=login');
  }

  /**
   * Asserts that environment is logged in as alternate user
   * @param  {String} userName Full name of user ('First Last')
   * @return {Boolean}
   */
  Selenium.prototype.assertSfdcLoggedInAsUser = function (userName) {
    selbot = this;
    var expectedValue = 'Logged in as ' + userName;
    var actualValue = this.page().findElement('xpath=//div[contains(@class,"messages")]//span[contains(@class,"pageMsg")]/text()').data;
    var actualValueTrimmed = actualValue.slice(0,actualValue.indexOf(' ('));
    Assert.matches(expectedValue,actualValueTrimmed);
  }

  /**
   * Asserts that environment is NOT logged in as alternate user
   * @param  {String} userName Full name of user ('First Last')
   * @return {Boolean}
   */
  Selenium.prototype.assertNotSfdcLoggedInAsUser = function (userName) {
    selbot = this;
    var expectedValue = 'Not Found';
    var actualValue;
    try {
      actualValue = this.page().findElement('xpath=//div[contains(@class,"messages")]//span[contains(@class,"pageMsg")]/text()').data;
    } catch (e) {
      LOG.debug(e);
    }
    if (typeof actualValue === 'undefined' || !actualValue) {
      actualValue = 'Not Found';
    } else {
      if(actualValue.indexOf(userName) == -1){
        actualValue = 'Not Found';
      };
    }
    Assert.matches(expectedValue,actualValue);
  }

  /**
   * Logs user out from global header
   * TODO:0 Add checks for additional logout UI experiences
   */
  Selenium.prototype.doSfdcLogoutAsUser = function () {
    selbot = this;
    selbot.doClick('xpath=//a[@id="globalHeaderNameMink" and contains(@class,"zen-trigger")]');
    selbot.doClick('xpath=//a[@title="Logout"]');
  }

  /**
   * Opens the record edit page by clicking the "edit" button
   * SPRINT:30 Rename with doSfdcRecordClickEdit
   */
  Selenium.prototype.doSfdcEditRecord = function () {
    selbot = this;
    selbot.doClick('name=edit');
    // selbot.doOpen(recordId + '/e?retURL=%2F' + recordId);
  }

  Selenium.prototype.doSfdcSetLookupField = function (fieldName, lookupValue) {
    selbot = this;
    selbot.doClick('css=a[id$="_lkwgt"]');

    var element;

    while(!element) {
      try {
        element = selbot.page().findElement("id=lksrch");
      } catch (e) {
        LOG.warn(e);
      }
    }
    LOG.warn(element)
    // Replace the element text with the new text
    selbot.page().replaceText(element, fieldValue);
    selbot.doClick("name=go");

  }

  /**
   * Set the values of multiple fields on a record edit page
   * @param  {Object} fieldParams JSON object of field label and field value key-value pairs
   */
  Selenium.prototype.doSfdcSetEditFields = function (fieldParams) {
    selbot = this;
    var params = JSON.parse(fieldParams);
    var sObject = sfdc.api.getSObjectFromId(sfdc.ui.getIdFromLocation(selbot.browserbot.getUserWindow().location));
    var fieldLabelIdMap = sfdc.ui.getFieldIdsFromEditPage();
    var fieldLabels = "'" + Object.keys(fieldLabelIdMap).join("','") + "'";
    var query = "SELECT Id, DataType, DurableId, EntityDefinition.DurableId, EntityDefinition.DeveloperName, EntityDefinition.Label, Label, Length, MasterLabel, Precision, QualifiedApiName, Scale FROM FieldDefinition WHERE EntityDefinition.DeveloperName = '" + sObject.DeveloperName + "' AND MasterLabel IN (" + fieldLabels + ")";
    LOG.warn(query);
    // Get field metadata (data types)
    var response = sfdc.api.queryTooling(query).records;
    sfdc.util.printObject(response[0]);

    var fieldDefinitionMap = {};
    response.forEach(function(fieldDefinition,idx,arr){
      fieldDefinitionMap[fieldDefinition.Label] = fieldDefinition;
    });

    // {
    //   'Name' : function () {},
    //   'Picklist' : function () {},
    //   'Hierarchy' : function () {},
    //   'Phone' : function () {},
    //   'Fax' : function () {},
    //   'Text(40)' : function () {},
    //   'URL(255)' : function () {},
    //   'Text(20)' : function () {},
    //   'Currency(18,0)' : function () {},
    //   'Number(8,0)' : function () {},
    //   'Content(20)' : function () {},
    //   'Long Text Area(32000)' : function () {},
    //   'Text(80)' : function () {},
    //   'Number(3,0)' : function () {},
    //   'Text(10)' : function () {},
    //   'Date'  : function () {}
    // }

    for (var key in params) {

      var fieldDefinition = fieldDefinitionMap[key];
      var fieldId = fieldLabelIdMap[key];
      var fieldValue = params[key];
      // Enter field value

      var element = selbot.page().findElement("id="+fieldId);
      // Replace the element text with the new text
      selbot.page().replaceText(element, fieldValue);

    }

  };

  Selenium.prototype.doSfdcSetEditField = function (fieldLabel, fieldValue) {
    selbot = this;
    var response = sfdc.api.toolinqQuery("SELECT Metadata FROM CustomField WHERE Id = '"+  +"'");
  };

  Selenium.prototype.assertSfdcButtons = function (buttonTitles) {

      selbot = this;
      var expectedTitles, actualTitles;

      expectedTitles = buttonTitles.split(',');
      actualTitles = expectedTitles.map(function(title){
        var found;
        try {
          found = selbot.page().findElement("css=#topButtonRow > input[title='"+title+"']").title;
        }
        catch (e) {
          LOG.error(e);
        }
        finally {
          if(!found){
            found = '';
          }
        }
        return found;
      });

      Assert.matches(expectedTitles.toString(),actualTitles.toString());

  };

  // TODO:70 sfdc.getFields (params, variableName) - Generic with parameters to execute other methods
  // TODO:40 assertSfdcField (fieldName, fieldvalue)

})(sfdc.ui);

// =============================================================================
// sfdc.util namespace

// Local File Loader
// Private utilities borrowed and exposed from selbocks user-extensions.js
// from: selblocks user-extensions.js
// from: [data-driven.js](http://web.archive.org/web/20120928080130/http://wiki.openqa.org/display/SEL/datadriven)
(function($$){


  // Adapted from the datadriven plugin
  // http://web.archive.org/web/20120928080130/http://wiki.openqa.org/display/SEL/datadriven

  $$.doAjaxRequest = function (filepath, mimeType) {
      LOG.debug("in doAjaxRequest");
      var fileReader = new FileReader();
      var fileUrl = urlFor(filepath);
      var xmlHttpReq = fileReader.getDocumentSynchronous(fileUrl, mimeType);
      LOG.info("Reading from: " + fileUrl);
      return xmlHttpReq;
  };

  function urlFor (filepath) {
    if (filepath.indexOf("http") == 0) {
      return filepath;
    }
    var URL_PFX = "file://";
    var url = filepath;
    if (filepath.substring(0, URL_PFX.length).toLowerCase() !== URL_PFX) {
      var testCasePath = testCase.file.path.replace("\\", "/", "g");
      var i = testCasePath.lastIndexOf("/");
      url = URL_PFX + testCasePath.substr(0, i) + "/" + filepath;
    }
    return url;
  }

  // ==================== File Reader ====================
  // Adapted from the include4ide plugin

  function FileReader () {}

  FileReader.prototype.prepareUrl = function(url) {
    var absUrl;
    // htmlSuite mode of SRC? TODO:60 is there a better way to decide whether in SRC mode?
    if (window.location.href.indexOf("selenium-server") >= 0) {
      LOG.debug("FileReader() is running in SRC mode");
      // there's no need to absolutify the url, the browser will do that for you
      // when you make the request. The data may reside anywhere on the site, or
      // within the "virtual directory" created by the Selenium server proxy.
      // I don't want to limit the ability to parse files that actually exist on
      // the site, like sitemaps or JSON responses to api calls.
      absUrl = url;
    }
    else {
      absUrl = absolutify(url, selbot.baseUrl);
    }
    LOG.debug("FileReader() using URL to get file '" + absUrl + "'");
    return absUrl;
  };

  FileReader.prototype.getDocumentSynchronous = function(url, mimeType) {
    var absUrl = this.prepareUrl(url);
    var requester = this.newXMLHttpRequest();
    if (!requester) {
      throw new Error("XMLHttp requester object not initialized");
    }
    if (mimeType) {
      requester.overrideMimeType(mimeType);
    }
    requester.open("GET", absUrl, false); // synchronous (we don't want Selenium to go ahead)
    try {
      requester.send(null);
    }
    catch(e) {
      throw new Error("Error while fetching URL '" + absUrl + "':: " + e);
    }
    if (requester.status !== 200 && requester.status !== 0) {
      throw new Error("Error while fetching " + absUrl
        + " server response has status = " + requester.status + ", " + requester.statusText );
    }
    return requester;
  };

  FileReader.prototype.newXMLHttpRequest = function() {
    var requester = 0;
    try {
      // for IE/ActiveX
      if (window.ActiveXObject) {
        try {       requester = new ActiveXObject("Msxml2.XMLHTTP"); }
        catch(ee) { requester = new ActiveXObject("Microsoft.XMLHTTP"); }
      }
      // Native XMLHttp
      else if (window.XMLHttpRequest) {
        requester = new XMLHttpRequest();
      }
    }
    catch(e) {
      throw new Error("Your browser has to support XMLHttpRequest in order to read data files\n" + e);
    }
    return requester;
  };

})(sfdc.util);

// File Management
(function($$){

  $$.loadFileXML = function (filePath) {
    var xmlHttpReq = $$.doAjaxRequest(filePath, 'text/xml');
    var response = xmlHttpReq.responseXML;
    return response;
  }

  $$.loadFileJSON = function (filePath) {
    var xmlHttpReq = $$.doAjaxRequest(filePath, 'text/json');
    var response = JSON.parse(xmlHttpReq.responseText);
    return response;
  }

  $$.loadFileXLSX = function () {};

  Selenium.prototype.doSfdcLoadFileXML = function (filePath, variableName) {
    selbot = this;
    var response = $$.loadFileXML(filePath);
    storedVars[variableName] = response;
    LOG.warn(response.getElementsByTagName('connected-app')[0].getAttributeNode("client-id").value);

  }

  Selenium.prototype.doSfdcLoadFileJSON = function (filePath, variableName) {
    selbot = this;
    var response = $$.loadFileJSON(filePath);
    storedVars[variableName] = response;
    LOG.warn(response.connectedApp.clientId);
  }

  // https://github.com/SheetJS/js-xlsx
  // http://stackoverflow.com/questions/8238407/how-to-parse-excel-file-in-javascript-html5
  Selenium.prototype.doSfdcLoadFileXLSX = function (filePath) {
    var xmlHttpReq = $$.doAjaxRequest('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.8.0/xlsx.js','application/javascript');
    eval(xmlHttpReq.responseText);
    $$.printObject(XLSX, true);

    var xmlDoc = $$.doAjaxRequest('test-data-excel.xml','text/xml').responseXML;
    var workbook = XLSX.read(xmlDoc, {type : 'binary'});
    workbook.SheetNames.forEach(function(sheetName){
        // Here is your object
        var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        var json_object = JSON.stringify(XL_row_object);
        console.log(json_object);

    })
  }

})(sfdc.util);

// Command Management
(function($$){

  $$.testCaseOriginalCommands = [];

  $$.insertCommand = function (command, target, value) {

    // Add final command to remove any inserted commands
    if($$.testCaseOriginalCommands.size > 0) {
      $$.testCaseOriginalCommands = testCase.commands;
    }
    var commandCount = testCase.commands.length;
    var currentIndex = testCase.debugContext.debugIndex;
    var currentRow = testCase.commands[currentIndex];
    var lastRow = testCase.commands[commandCount - 1];
    var commandsNew = [];

    LOG.warn('currentIndex: ' + currentIndex);
    LOG.warn('currentRow: ');
    $$.printObject(currentRow);

    for (var i=0; i < commandCount; i++) {
      var row = testCase.commands[i];
      if (row.index > currentRow.index) {
        row.index = row.index + 1;
      }
      commandsNew.push(row);
    }

    // var commandNew = new Command('storeEval','function blah(){return "blah"}; blah();','field_id_name_value');
    var commandNew = new Command(command, target, value);
    commandNew.index = currentRow.index + 1;
    commandsNew.splice(currentIndex + 1, 0, commandNew);

    if (lastRow.command != 'removeCommands') {
      var commandClean = new Command('removeCommands');
      commandClean.index = lastRow.index + 1;
      commandsNew.push(commandClean);
    }

    testCase.setCommands(commandsNew);

  };

  $$.removeCommands = function () {
    testCase.debugContext.debugIndex = testCaseOriginalCommands.length - 1;
    var resetCommands = testCaseOriginalCommands;
    testCaseOriginalCommands = [];
    testCase.setCommands(resetCommands);
  };

  Selenium.prototype.doRemoveCommands = function () {
    $$.removeCommands();
  }

})(sfdc.util);

// General Utilities
(function($$){

  $$.getTimestamp = function(){
    var d = new Date();
    return [d.getFullYear(),d.getMonth(),d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds()].join('.').replace(/\\.(\\d{1})\\./,'.0$1.');
    // 2016.02.24.15.45.53
  }

  // Checks whether string matches 15-18 digit Salesforce ID format
  $$.isValidId = function (idString) {
    LOG.debug('in sfdc.util.isValidId');
    if (/[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}/.test(idString)) {
      return true;
    } else {
      throw new Error("Invalid Salesforce Record Id");
    }
  }

  /**
   * Prints keys and values of a given object
   * @param  {Object} o The object to be printed
   * @see     http://stackoverflow.com/questions/1625208/print-content-of-javascript-object
   * @example sfdc.util.printObject(this.page());
   */
  $$.printObject = function (o, visibleLog) {
    if(visibleLog) {
      LOG.warn('in sfdc.util.printObject');
    }
    LOG.debug('in sfdc.util.printObject');
    var out = '';
    for (var p in o) {
      out += p + ': ' + o[p] + '\n';
    }
    if(visibleLog) {
      LOG.warn(out);
    }
    LOG.debug(out);
    return out;
  }

  /**
   * Converts JSON param object into URI encoded query string
   * @param  {Object} jsonParams JSON object with key-value parameters
   * @return {String}               URI encoded query string
   */
  // TODO:30 Move to sfdc.api.encodeParams?
  $$.encodeParams = function (jsonParams) {
    LOG.debug('in sfdc.util.encodeParams');
    var urlParams = [].filter.call(Object.keys(jsonParams), function(param){
      return param;
    }).map(function(param){
      return encodeURIComponent(param) + '=' + encodeURIComponent(jsonParams[param]);
    }).join('&');
    return urlParams;
  };

})(sfdc.util);

// =============================================================================
// sfdc.data namespace

// Replaces sfdc.model.fields
(function($$){

  $$.FIELDS = {};

})(sfdc.data);


/******************************* SFDC Extension *******************************/
