const https = require('https');
const fs = require('fs')
const zlib = require('zlib');
env = process.env;

/**
 *  Print error message and exit
 */
function failWithError(message, exitCode=1) {
    console.log(`::error::${message}`);
    process.exit(exitCode);
}

/**
 * requestGitHubAPI Make https request to github repo
 *
 * @param {string} method Request method. e.g. 'GET', 'POST'
 * @param {string} path Path in github. e.g. /repos/<my repo>/git/refs/tags/<tag-prefix>
 * @param {object} data Data to send if request is POST
 * @param {function} callback Callback function
 */
function requestGitHubAPI(method, path, data, callback) {
    try {
        if (data) {
            data = JSON.stringify(data);
        }  
        const options = {
            hostname: 'api.github.com',
            port: 443,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data ? data.length : 0,
                'Accept-Encoding' : 'gzip',
                'Authorization' : `token ${env.INPUT_TOKEN}`,
                'User-Agent' : 'GitHub Action - development'
            }
        }
        const req = https.request(options, res => {
            let chunks = [];
            res.on('data', d => chunks.push(d));
            res.on('end', () => {
                let buffer = Buffer.concat(chunks);
                if (res.headers['content-encoding'] === 'gzip') {
                    zlib.gunzip(buffer, (err, decoded) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, res.statusCode, decoded && JSON.parse(decoded));
                        }
                    });
                } else {
                    callback(null, res.statusCode, buffer.length > 0 ? JSON.parse(buffer) : null);
                }
            });
            req.on('error', err => callback(err));
        });
        if (data) {
            req.write(data);
        }
        req.end();
    } catch(err) {
        callback(err);
    }
}

function main() {
    const prefix = `${env.INPUT_PREFIX}`; // default specified in action.yml
    let nextBuildNumber;
    /* 
      GET tags with specified prefix, based on the response:
       - determine new tag hame (with updated build number)
       - POST new tag
       - output new build number (in case later steps want it)
    */
    requestGitHubAPI('GET', `/repos/${env.GITHUB_REPOSITORY}/git/refs/tags/${prefix}`, null, (err, status, result) => {
       if (status === 404) {
            console.log(`No ${prefix} ref available, starting at 1.`);
            nextBuildNumber = 1;
       } else if (status === 200) {
            const regexString = `/${prefix}(\\d+)$`;
            const regex = new RegExp(regexString);
            let tagsMatchingPrefix = result.filter(d => d.ref.match(regex));
            let existingBuildNumbers = tagsMatchingPrefix.map(t => parseInt(t.ref.match(/-(\d+)$/)[1]));
            let currentBuildNumber = Math.max(...existingBuildNumbers);
            console.log(`Largest ${prefix} number is ${currentBuildNumber}.`);
            nextBuildNumber = currentBuildNumber + 1;
            console.log(`Updating ${prefix} counter to ${nextBuildNumber}...`);
        } else {
            if (err) {
                failWithError(`Failed to get refs. Error: ${err}, status: ${status}`);
            } else {
                failWithError(`Getting build-number refs failed with http status ${status}, error: ${JSON.stringify(result)}`);
            } 
       }
       let newTagData = {
            ref:`refs/tags/${prefix}${nextBuildNumber}`, 
            sha: env.GITHUB_SHA
        };
        /*
           POST new tag to repository
        */
        requestGitHubAPI('POST', `/repos/${env.GITHUB_REPOSITORY}/git/refs`, newTagData, (err, status, result) => {
            if (status !== 201 || err) {
                failWithError(`Failed to create new ${prefix} tag. Status: ${status}, err: ${err}, result: ${JSON.stringify(result)}`);
            }
            console.log(`Successfully created new tag: ${prefix}${nextBuildNumber}`);
            /*
              Output the new build number to GitHub output and environment variables in case the user's 
              subsequent steps want to make use of it
            */
            fs.writeFileSync(process.env.GITHUB_OUTPUT, `build_number=${nextBuildNumber}`);
            fs.writeFileSync(process.env.GITHUB_ENV, `BUILD_NUMBER=${nextBuildNumber}`);
         });
    });

}

main();


