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
                postQuestionnaireResponse(client, responseJson);
            }
        });
    });
});