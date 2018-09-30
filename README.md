# Bambu
#Suggestion API

This API is used to compute the score based on the query strings(age,monthlyIncome,latitude,longitude and experienced)

Scoring matrix for all fields are defined  in a configuration file named by 'settings.json'. 
Based on the business needs, business analysts can change this configuration file. 
After this change, no need to re-start the server.

Docker image and the unit test case for the core logic is defined for this API.

Below are the sample suggestion matrix for all fields
"ageSuggestionMatrix":[
        {
            "lowerLimit": 0,
            "upperLimit": 1,
            "suggestionLevel": 0.5
        },
        {
            "lowerLimit": 2,
            "upperLimit": 5,
            "suggestionLevel": 0.3
        },
        {
            "lowerLimit": 6,
            "upperLimit": 10,
            "suggestionLevel": 0.2
        }
    ],
    "monthlyIncomeSuggestionMatrix":[
        {
            "lowerLimit": 0,
            "upperLimit": 100,
            "suggestionLevel": 0.8
        },
        {
            "lowerLimit": 101,
            "upperLimit": 300,
            "suggestionLevel": 0.5
        },
        {
            "lowerLimit": 301,
            "upperLimit": 500,
            "suggestionLevel": 0.2
        }
    ],
    "experiencedFlagSuggestion":0.2,
    "latLongSuggestionMatrixInMeters":[
        {
            "lowerLimit": 0,
            "upperLimit": 100,
            "suggestionLevel": 0.5
        },
        {
            "lowerLimit": 101,
            "upperLimit": 300,
            "suggestionLevel": 0.3
        },
        {
            "lowerLimit": 301,
            "upperLimit": 500,
            "suggestionLevel": 0.2
        }
    ]
