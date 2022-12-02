var fs = require('fs');
var exec = require('child_process').execSync;
var fetch = require('node-fetch');
// use express
var express = require('express');
const path = require('path');
const request = require('request');


const app = express();

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
    get_token();
    res.sendFile(path.join(__dirname + '/logged_in.html'));
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
        })
        // iterate over files where data.length is not defined

        // construct link to file by first removing all url parameters
        // then add file name
        // file_url += file;
        // curl_and_save(file_url);

        .catch(function (error) {
            console.log(error);
        });
}

function get_token() {
    var target_url = "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/auth";
    var current_url = window.location.href;

    // get code from url parameter
    var url = new URL(current_url);
    var code = url.searchParams.get("code");

    console.log('code', code)
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
}

