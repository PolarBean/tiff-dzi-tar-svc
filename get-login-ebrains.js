const request = require('request');
var token = "token";
var target_url = "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/auth";
var current_url = window.location.href;

// get code from url parameter
var url = new URL(current_url);
var code = url.searchParams.get("code");


var headers = {
    "grant_type": "authorization_code",
    "client_id": "ImageIngestion",
    "code": code,
    // insert environment variable called clienat secret
    "client_secret": process.env.CLIENT_SECRET
};

var options = {
    "method": "GET",
    "url": target_url,
    "headers": headers
};
// log request as url


// make POST request to get token
request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
});
