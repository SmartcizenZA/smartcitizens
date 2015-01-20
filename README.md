Smart CitizenS
==============

Introduction
============
This is a web-based project, which is also mobile-friendly. It is based on NodeJS, Express, and MongoDB. The project enables citizens to log their meter readings (water or electricity) and e-mail them to their municipality (at least for Tshwane Municipality). Users need to register and add a property to use the service. 

Functionality Provided
======================

- Submit Readings
- View Readings
- Receive Notifications
- Check Consumption History


Installation (Development)
==========================

The service is node-based (NodeJS must be installed including the node package manager) and all the modules in the package.json file need to be installed. It is preferrable to clone the branch and the run npm install in the project's directory.

The service uses MongoDB (database), Passport (authentication), Express and Jade (web-pages rendering). You may check the app.js file for more modules that are required by the service. The database name is also included in the same file (e.g. smartcitizens)

Once all modules (dependencies) have been installed, you may start the project on your local machine using <b> npm start </b>, which uses the bin/www server script. The server runs on port 3000, but this could be changed to suit your needs.


<strong>Note:</strong> for the email system (emailer.js) to work you need the smartcitizen username and password or alternatively create your own gmail email and password 
