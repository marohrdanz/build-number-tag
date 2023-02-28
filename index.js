const https = require('https');
const zlib = require('zlib');
const core = require('@actions/core');
const github = require('@actions/github');
env = process.env;

/**
 * requestGitHubAPI Make https request to github repo
 *
 * @param {string} method Request method. e.g. 'GET', 'POST'
 * @param {string} path Path in github. e.g. /repos/<my repo>/git/refs/tags/<tag-prefix>
 * @param {object} data Data to send if request is POST
 * @param {function} callback Callback function
 */
function requestGitHubAPI(method, path, data, callback) {
    core.debug(`Making ${method} request`);
    core.debug(`Path for request: ${path}`);
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
    //const prefix = `${env.INPUT_PREFIX}`; // default specified in action.yml
    const prefix = core.getInput('prefix');
    core.debug(`Tag prefix: ${prefix}`);
    let nextBuildNumber;
    /* 
      GET tags with specified prefix, based on the response:
       - determine new tag hame (with updated build number)
       - POST new tag
       - output new build number (in case later steps want it)
    */
    requestGitHubAPI('GET', `/repos/${env.GITHUB_REPOSITORY}/git/refs/tags/${prefix}`, null, (err, status, result) => {
       core.error("How does this appear?")
       if (status === 404) {
            core.info(`No ${prefix} ref available, starting at 1.`);
            nextBuildNumber = 1;
       } else if (status === 200) {
            const regexString = `/${prefix}(\\d+)$`;
            const regex = new RegExp(regexString);
            let tagsMatchingPrefix = result.filter(d => d.ref.match(regex));
            let existingBuildNumbers = tagsMatchingPrefix.map(t => parseInt(t.ref.match(/-(\d+)$/)[1]));
            let currentBuildNumber = Math.max(...existingBuildNumbers);
            core.info(`Largest '${prefix}' tag is ${currentBuildNumber}.`);
            nextBuildNumber = currentBuildNumber + 1;
            core.info(`Updating '${prefix}' counter to ${nextBuildNumber}.`);
        } else {
            if (err) {
                core.error(`Failed to get refs. Error: ${err}, status: ${status}`);
                core.setFailed(`Failed to get refs. Error: ${err}, status: ${status}`);
            } else {
                core.error(`Getting build-number refs failed with http status ${status}, error: ${JSON.stringify(result)}`);
                core.setFailed(`Getting build-number refs failed with http status ${status}, error: ${JSON.stringify(result)}`);
            } 
       }
       let newTagData = {
            ref:`refs/tags/${prefix}${nextBuildNumber}`, 
            sha: env.GITHUB_SHA
        };
        core.debug(`Making new tag: ${prefix}${nextBuildNumber}`);
        /*
           POST new tag to repository
        */
        requestGitHubAPI('POST', `/repos/${env.GITHUB_REPOSITORY}/git/refs`, newTagData, (err, status, result) => {
            if (status !== 201 || err) {
                core.error(`Failed to create new ${prefix} tag. Status: ${status}, err: ${err}, result: ${JSON.stringify(result)}`);
                core.setFailed(`Failed to create new ${prefix} tag. Status: ${status}, err: ${err}, result: ${JSON.stringify(result)}`);
            }
            core.notice(`Created new tag: ${prefix}${nextBuildNumber}`);
            core.setOutput("build_number", nextBuildNumber);
         });
    });

}

main();


