const https = require('https');
const zlib = require('zlib');
const core = require('@actions/core');
const github = require('@actions/github');

const myToken = core.getInput('token');
const octokit = github.getOctokit(myToken);
const repo_name = github.context.payload.repository.name;
const repo_owner = github.context.payload.repository.owner.name;

main();

async function getAllTags() {
  const options =  {
    owner: repo_owner,
    repo: repo_name
  };
  core.debug(`Options for getAllTags: ${options}`);
  core.debug(JSON.stringify(options, null, 4));
  const response = await octokit.rest.repos.listTags(options);
  core.debug(response);
  allTags = response.data;
  return(allTags);
}

function getTagsMatchingPrefix(tags) {
  const prefix = core.getInput('prefix');
  core.debug(`Tag prefix: ${prefix}`);
  const regexString = `${prefix}(\\d+)$`;
  const regex = new RegExp(regexString);
  let tagsMatchingPrefix = tags.filter(t => t.name.match(regex));
  return (tagsMatchingPrefix);
}


async function main() {
    //const prefix = `${env.INPUT_PREFIX}`; // default specified in action.yml
    try {
      let allTags = await getAllTags();
      let tagsMatchingPrefix = getTagsMatchingPrefix(allTags);
      let build_number;
      if (tagsMatchingPrefix.length < 1) {
        build_number = 0;
      } else {
        //core.debug("Tags matching prefix: ");
        //core.debug(JSON.stringify(tagsMatchingPrefix, undefined, 2));
        let existingBuildNumbers = tagsMatchingPrefix.map(t => parseInt(t.name.match(/-(\d+)$/)[1]));
        core.debug("Existing build numbers: ", JSON.stringify(existingBuildNumbers, undefined, 2));
        let currentBuildNumber = Math.max(...existingBuildNumbers);
        core.info(`Largest '${prefix}' tag is ${currentBuildNumber}.`);
        build_number = currentBuildNumber + 1;
        core.info(`Updating '${prefix}' counter to ${build_number}.`);
      }
    } catch(err) {
      core.error(err);
      core.setFailed(err);
    }


}



