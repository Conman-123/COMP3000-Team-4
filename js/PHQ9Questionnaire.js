function createResponseJson(template, reponse) {
    var responseJson = template;
    for (var i = 0; i < 10; i++) {
        responseJson.item[i].answer[0].valueCoding.code = reponse[i].value;
    }

    return responseJson;
}

$(document).ready(function () {
    // Use this block while testing with an open FHIR server
    const client = FHIR.client({
        serverUrl: "http://hapi.fhir.org/baseR4",
        tokenResponse: {
            patient: "1303022"
        }
    });
    initPage(client);

    // Use this line instead when using a SMART on FHIR auth server
    //FHIR.oauth2.ready().then(initPage).catch(console.error);

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
                postQuestionnaireResponse(client, responseJson);
            }
        });
    });
});