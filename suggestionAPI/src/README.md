#Suggestion API

This API is used to compute the score based on the query strings(age,monthlyIncome,latitude,longitude and experienced)

Scoring matrix for all fields are defined  in a configuration file named by 'settings.json'. 
Based on the business needs, business analysts can change this configuration file. 
After this change, no need to re-start the server.

Docker image and the unit test case for the core logic is defined for this API.