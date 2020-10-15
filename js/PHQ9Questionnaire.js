function createResponseJson(template, reponse) {
    var responseJson = template;
    for (var i = 0; i < 9; i++) {
        responseJson.item[0].item[i].answer[0].valueCoding.code = reponse[i].value;
    }
    responseJson.item[1].answer[0].valueCoding.code = reponse[9].value;
    
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
        url: "/resources/PHQ_9_Patient_Health_Questionnaire_9.json",
        type: "GET",
        success: function (data) {
            var questions = getQuestionData(data.item);
            console.log(questions);
            displayQuestionnaire(questions, null, "questionnaire");
        }
    });

    $("#questionnaire").submit(function (event) {
        event.preventDefault();
        response = $("#questionnaire").serializeArray();
        console.log(response);

        $.ajax({
            url: "/testResources/phq9-questionnaire-response.json",
            type: "GET",
            success: function (data) {
                var responseJson = createResponseJson(data, response);
                postQuestionnaireResponse(globalClient, responseJson).then(function (success) {
                    if (success === true) window.location = "/index.html";
                    else (alert("An error occurred submitting this questionnaire response."));
                });
            }
        });
    });
});