Salesforce REST API for Selenium IDE
====================================

Table of Contents
-----------------

-	[Overview](#overview)
-	[Setup](#setup)
-	[Methods](#methods)
-	[Examples](#examples)
-	[Additional Resources](#additional_resources)

---

<a name="overview"></a>

Overview
--------

The `selenium-sfdc` extension allows Selenium IDE tests to interact at a higher level with the Salesforce UI, and at a deeper level with the Salesforce API.

*This repo is in rough development, and has plenty of areas for growth. If you would like to see improvements in this extension, please submit a pull request.*

#### Use Cases

-	Simplify IDE usage with high-level Salesforce commands
-	Query field metadata to create more precise field selectors
-	Query hidden data after users make an update from the UI
-	Execute Unit tests as part of a Selenium test suite
-	Generate core test records in a new sandbox (Account > Contact > Opportunity)

---

<a name="setup"></a>

Setup
-----

### Create a Salesforce Connected App

-	Log into Salesforce as an admin user
-	Navigate to `Setup > Build > Create > Apps`
-	Follow the instructions from Salesforce [here](https://help.salesforce.com/apex/HTViewHelpDoc?id=connected_app_create.htm) and [here](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_defining_remote_access_applications.htm) to create a new Connected App.
-	Provide the following details for your connected app:
	-	`Connected App Name` : `selenium_ide`
	-	`Description` : `Salesforce REST APIs for the Selenium IDE`
	-	`Enable OAuth Settings` : `Checked`
	-	`Selected OAuth Scope` : `Full access (full)`
-	Open the Connected App and write down the values for `Consumer Key` and `Consumer Secret`
-	Follow the instructions from Salesforce [here](https://help.salesforce.com/apex/HTViewSolution?id=000212208&language=en_US) to assign user access to the Connected App
-	For the logging in user, write down the values for `Username`, `Password` and `Security Token`

### Configure the Selenium IDE

-	[Download](#download_link) the `selenium-sfdc` project repository.
-	Open the Selenium IDE and navigate to `Options > General > Selenium Core extensions (user-extensions.js) > Browse...`
-	Locate `selenium-sfdc.js` and click `Open`
-	Restart the Selenium IDE

---

<a name="methods"></a>

SFDC API Methods
----------------

-	For detailed API specifications, please open the [Jasmine Test Runner](/SpecRunner.html) ([Local](file:///Users/isaac.lewis/repos/selenium/selenium-sfdc/SpecRunner.html#)).
-	For samples of API usage in Selenium, please open the [Selenium Test Suite](/Test Suite/Test Suite - Selenium for Salesforce.html) ([Local](/Users/isaac.lewis/repos/selenium/selenium-sfdc/Test Suite/Test Suite - Selenium for Salesforce.html)).

| Command                      | Description |
|------------------------------|-------------|
| **sfdc.util**                |             |
| sfdc.util.encodeParams       |             |
| sfdc.util.printObject        |             |
| **sfdc.api**                 |             |
| sfdc.api.callout             |             |
| sfdc.api.login               |             |
| sfdc.api.query               |             |
| sfdc.api.toolingQuery        |             |
| sfdc.api.describeSObject     |             |
| sfdc.api.runTestsSynchronous |             |
| **sfdc.ui**                  |             |

SFDC Selenium Methods
---------------------

| Command                                             | Description |
|-----------------------------------------------------|-------------|
| sfdcLogin                                           |             |
| sfdcLoginAsUser                                     |             |
| sfdcLogoutAsUser                                    |             |
| sfdcOpenHomeAndWait                                 |             |
| sfdcOpenRecordAndWait                               |             |
| sfdcDescribePageLayout (ObjectName, RecordTypeName) |             |
| sfdcAssertButton                                    |             |
| sfdcAssertField                                     |             |
| sfdcAssertRelatedList                               |             |
| sfdcGetFieldMap                                     |             |
| sfdcGetFieldValue                                   |             |
| sfdcSetFieldValue                                   |             |
| sfdcSetFieldRecordType                              |             |
| sfdcSetFieldLookup                                  |             |

---

<a name="examples"></a>

Examples
--------

### Authentication

| Command   | Target                          | Value                        |
|-----------|---------------------------------|------------------------------|
| store     | `CONNECTED_APP_CONSUMER_KEY`    | client_id                    |
| store     | `CONNECTED_APP_CONSUMER_SECRET` | client_secret                |
| store     | `user@email.com`                | username                     |
| store     | `P@SSW0RD`                      | password                     |
| store     | `K2vgoIeiDBufPQNUVAAukwix`      | security_token               |
| loginSFDC | ${username}                     | ${password}${security_token} |

### Queries

| Command      | Target                                                                            | Value          |
|--------------|-----------------------------------------------------------------------------------|----------------|
| querySOQL    | SELECT Id, Name FROM Account LIMIT 5                                              | accounts       |
| echo         | javascript{storedVars['accounts'][0].Name}                                        | \-             |
| queryTooling | SELECT Id, DeveloperName FROM CustomField WHERE TableEnumOrId = 'Account' LIMIT 5 | account_fields |
| echo         | javascript{storedVars['account_fields'][0].Id}                                    | \-             |

---

-	[Questions](#questions)

---

<a name="additional_resources"></a>

Additional Resources
--------------------

#### HTTP Requests

-	[MDN - Synchronous vs Asynchronous XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Synchronous_and_Asynchronous_Requests)

#### Selenium Extensions

-	[Sample User Extension](https://java.net/projects/ajaxnetbeans/sources/svn/content/trunk/pro-ajax-and-java-examples/web/Chapter02/selenium/user-extensions.js.sample?rev=80)
-	[AJAX Selenium Extension](http://www.nuxeo.com/blog/selenium-ajax-requests/fox)
-	[Beginner's Guide to Building Selenium Extensions & Plugins](https://www.packtpub.com/books/content/user-extensions-and-add-ons-selenium-10-testing-tools)
-	http://blog.walty8.com/painful-selenium-part-4-firefox-screenshot/
-	http://www.theautomatedtester.co.uk/tutorials/selenium/selenium_extension.htm
-	http://agiletesting.blogspot.com/2006/03/ajax-testing-with-selenium-using_21.html
-	http://www.sqaforums.com/forums/selenium/148586-how-use-user-extensions-javascript-selenium-webdriver.html

#### Selenium Loading Issues

-	http://stackoverflow.com/questions/5052193/extending-selenium-how-to-call-commands

#### Salesforce API

-	[Salesforce REST API Explorer (Workbench)](https://workbench.developerforce.com/)
-	[Salesforce REST API Documentation](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_what_is_rest_api.htm)
-	[Salesforce Tooling API Documentation](https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/)
-	[Automated Testing with Salesforce and Selenium](http://www.3pillarglobal.com/insights/automated-testing-with-salesforce-and-selenium)
-	[Selenium and Salesforce: Automation Testing Video Tutorial - Part 1](http://www.jitendrazaa.com/blog/salesforce/getting-started-with-selenium-and-salesforce-salesforce-automation-testing-video-tutorial-part-1/)

#### Code Standards

-	http://usejsdoc.org/about-getting-started.html
-	https://en.wikipedia.org/wiki/JSDoc
-	https://pear.php.net/manual/en/standards.sample.php
-	http://stackoverflow.com/questions/1635116/javascript-class-method-vs-class-prototype-method

#### Jasmine Testing

-	http://jasmine.github.io/2.4/introduction.html
-	http://jasmine.github.io/2.0/ajax.html
-	https://github.com/jasmine/jasmine-ajax
