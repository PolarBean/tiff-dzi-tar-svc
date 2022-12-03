var fs = require('fs');
var exec = require('child_process').execSync;
var fetch = require('node-fetch');
// use express
var express = require('express');
const path = require('path');
const request = require('request');
axios = require('axios');

const app = express();
var token = null;
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
// let users provide bucketurl as a parameter
app.get('/bucketurl/', (req, res) => {
    // const tarUrl = req.query.tarUrl;
    var bucket_url = req.query.bucketurl;
    console.log(bucket_url);
    iterate_over_bucket_files(bucket_url);
    res.send('done');
}
);
// serve index.html
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/app', function (req, res) {
    var code = req.query.code;
    get_token(code, res);
    // res.sendFile(path.join(__dirname + '/logged_in.html'));
});

app.get('/listBucket', function (req, res) {
    var bucket_url = req.query.bucketurl;
    list_bucket_files(bucket_url, res);
    });

app.listen(port, ip, () => {
    console.log(`test Example app listening at http://localhost:${port}`)
}
);
app.use(express.static(path.join(__dirname, 'public')));

// use java cli tool pyramidio/pyramidio-cli.1.1.4.jar
// to convert image to dzi
function image_to_dzi(image) {
    console.log('image', image)
    var cmd = '/opt/app-root/src/miniconda3/bin/java -jar pyramidio/pyramidio-cli-1.1.4.jar -i ' + image + ' -icr 0.1 -tf jpg  -o . & ';
    console.log(cmd)
    promise = exec(cmd, function (error, stdout, stderr) {
        console.log(error);
        console.log(stderr);
        console.log(stdout);
    });
    return promise;
}

// function which converts dzi to tar
function dzi_to_tar(dzi_folder) {
    var cmd = 'tar -cvf ' + dzi_folder + '.tar ' + dzi_folder;
    // execute command and do not run asyncronously
    promise = exec(cmd, function (error, stdout, stderr) {
        console.log(error);
        console.log(stderr);
        console.log(stdout);
    });

    return promise;
}

function curl_and_save(url, file) {
    // split url to get filename
    console.log(url)
    console.log(file)
    var cmd = 'curl -L ' + url + ' > ' + file;
    console.log(cmd)
    promise = exec(cmd, function (error, stdout, stderr) {
        console.log(stdout);
        console.log(error);
        console.log(stderr);
    });
    return promise;
}

// function which posts tar to bucket
// function post_tar_to_bucket(tar) {
//     var exec = require('child_process').exec;
//     var cmd = 'curl -X POST -H "Content-Type: application/x-tar" -H "authorization: Bearer ' + token + ;

function iterate_over_bucket_files(url) {

        // fetch list of files from bucket
        var folder_url = url.split('?')[0];
        fetch(url)
            .then((resp) => resp.json())
            .then(function (data) {
                // get keys from data
                data = data['objects'];
                    for (var i = 0; i < data.length; i++) {
                        var name = data[i]['name'];
                        var file_url = folder_url + '/' + name;
                        console.log(file_url)
                        // download file
                        split_name = name.split('/');
                        var file_name = split_name[split_name.length - 1];
                        console.log(file_name)
                        curl_and_save(file_url, file_name)
                        // convert image to dzi
                        image_to_dzi(file_name)
                        // convert dzi to tar
                        dzi_folder = file_name.split('.')[0] + '_files';
                        dzi_to_tar(dzi_folder);
                    }
                }).catch(function (error) {
                console.log(error);
            });
        

    }






// function which lists all files in bucket
function list_bucket_files(bucket_url) {
    console.log(token);
}






function get_token(code, res) {
    var target_url = "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token";

    const params = new URLSearchParams({
        'grant_type': 'authorization_code',
        'client_id': 'ImageIngestion',
        'code': code,
        'client_secret': process.env.CLIENT_SECRET,
        'redirect_uri': 'https://tif-dzi-tar-svc-test.apps.hbp.eu/app'
        
    });
  

    // make POST request to get token
    axios({
        method: 'post',
        url: target_url,
        data: params.toString(),
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
    }).then(response => {
        console.log(response.data)
        token = response.data['access_token'];
        // direct user to logged_in.html 
        res.sendFile(path.join(__dirname + '/logged_in.html'));
        return token;
    }).catch(error => {
        console.log(error)
    });
    
}

