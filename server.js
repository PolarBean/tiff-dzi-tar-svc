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
    // redirect to localhost:8080 on the browser
    res.redirect('https://localhost:8080');
    // res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/app', function (req, res) {
    var code = req.query.code;
    get_token(code, res);
    // res.sendFile(path.join(__dirname + '/logged_in.html'));
});

app.get('/listBucket', function (req, res) {
    var bucket_name = req.query.bucketName;
    list_bucket_files(res, bucket_name);
    });
app.get('/tiffToTarDZI', function (req, res) {
    var bucket_name = req.query.bucketname;
    var file_name = req.query.selectedFile;
    convert_tiff_to_tarDZI(bucket_name, file_name);
    res.send('done');
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

function curl_and_save(bucket_name, file_name) {
    // split url to get filename
    console.log(url)
    console.log(file)
    requestURL = "https://data-proxy.ebrains.eu/api/v1/buckets/" + bucket_name + '/' + file_name + "?inline=false&redirect=false"
    axios.get(requestURL, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    }).then(function (response) {
            console.log(response.data);
        });

    // var cmd = "curl -X 'GET' " + url + " -H 'accept: application/json' -H 'Authorization: Bearer " + token + "'";
    // console.log(cmd);
    // promise = exec(cmd, function (error, stdout, stderr) {
    //     console.log(stdout);
    //     console.log(error);
    //     console.log(stderr);
    // });
    // return promise;
}

function convert_tiff_to_tarDZI(bucketname, file_name) {
    // download tiff file at url
    curl_and_save(bucket_name, file_name)
    // convert image to dzi
    image_to_dzi(file_name)
    // convert dzi to tar
    dzi_folder = file_name.split('.')[0] + '_files';    
    dzi_to_tar(dzi_folder);
}

    

function iterate_over_bucket_files(bucketname, folder_name) {
        var requestURl = "https://data-proxy.ebrains.eu/api/v1/buckets/" + bucketname + '/'  + folder_name + "?inline=false&redirect=true";
        // fetch list of files from bucket
        
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
function list_bucket_files(res, bucketname) {
    requestURl = "https://data-proxy.ebrains.eu/api/v1/buckets/" + bucketname + "?limit=50&delimiter=/";
    axios.get(requestURl, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    }).then(function (response) {
        console.log(response.data);
        res.send(response.data);
    }).catch(function (error) {
        console.log(error);
    });
    
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
        // here i update the global variable token
        token = response.data['access_token'];
        // direct user to logged_in.html 
        res.sendFile(path.join(__dirname + '/logged_in.html'));
        return token;
    }).catch(error => {
        console.log(error)
    });
    
    }


