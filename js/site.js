function isQuestionnaireResponseK10(response) {
    if (!response) return false;
    return response.questionnaire === "https://connect4.uqcloud.net/resources/K10_kessler_psychological_distress_scale.json"
}

function isQuestionnaireResponsePHQ9(response) {
    if (!response) return false;
    return response.questionnaire === "https://connect4.uqcloud.net/resources/PHQ_9_Patient_Health_Questionnaire_9.json"
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sortQuestionnaireResponsesByDate(responses) {
    responses.sort(function(a, b) {
        return (a.authored < b.authored) ? -1 : ((a.authored > b.authored) ? 1 : 0);
    });
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
});