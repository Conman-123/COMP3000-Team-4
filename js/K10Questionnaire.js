function createResponseJson(template, reponse) {
    var responseJson = template;
    for (var i = 0; i < 10; i++) {
        responseJson.item[i].answer[0].valueCoding.code = reponse[i].value;
    }

    // Add authored date
    responseJson.authored = moment().format(); // This should be the correct date time format for FHIR
    
    // Add patient id
    responseJson.subject = responseJson.subject || {};
    responseJson.subject.reference = "Patient/" + globalClient.patient.id;
    responseJson.subject.type = "Patient";
    
    return responseJson;
}

// -- Globals --
var globalClient;

function initPage(client) {
    globalClient = client;
}

$(document).ready(function () { 

    $.ajax({
        url: "/resources/K10_kessler_psychological_distress_scale.json",
        type: "GET",
        success: function (data) {
            var questions = getQuestionData(data.item);
            displayQuestionnaire(questions, null, "questionnaire");
        }
    });

    $("#questionnaire").submit(function (event) {
        event.preventDefault();
        response = $("#questionnaire").serializeArray();

        $.ajax({
            url: "/testResources/k10-response.json",
            type: "GET",
            success: function (data) {
                var responseJson = createResponseJson(data, response);
                console.log(responseJson);
                postQuestionnaireResponse(globalClient, responseJson).then(function (success) {
                   if (success === true) window.location = "/index.html";
                   else (alert("An error occurred submitting this questionnaire response."));
               });
            }
        });
    });
});