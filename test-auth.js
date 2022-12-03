// cannot use import statement outside a module
// get node fetch
const { response } = require('express');
const fetch = require('node-fetch');
var axios = require('axios');
var code = "6678cff7-470d-457d-a6d6-6abf3bf6f125.63381ff8-447e-43b4-ab8d-ba7c2164ca80.ImageIngestion" 
const params = new URLSearchParams({
    'grant_type': 'authorization_code',
    'client_id': 'ImageIngestion',
    'code': code,
    'client_secret': "K0HIytmmVGSsgfEFrXXxHD0wGGDqEg8C",
    'redirect_uri': 'https://tif-dzi-tar-svc-test.apps.hbp.eu/app'
    
});

var url = "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token";

axios({
    method: 'post',
    url: url,
    data: params.toString(),
    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
}).then(response => {
    console.log(response.data)
    var token = response.data['access_token'];
    return token;
}).catch(error => {
    console.log(error)
});

