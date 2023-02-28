const core = require('@actions/core');
const github = require('@actions/github');

const myToken = core.getInput('token');
const octokit = github.getOctokit(myToken);
const repo_name = github.context.payload.repository.name;
const repo_owner = github.context.payload.repository.owner.name;
//const prefix = core.getInput('prefix');
//core.debug(`Tag prefix: ${prefix}`);

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

function getTagsMatchingPrefix(tags, prefix) {
  const regexString = `${prefix}(\\d+)$`;
  const regex = new RegExp(regexString);
  let tagsMatchingPrefix = tags.filter(t => t.name.match(regex));
  return (tagsMatchingPrefix);
}

function getBuildNumber(tags, prefix) {
  let build_number;
  if (tags.length < 1) {
    core.info(`No tags matching ${prefix}. Setting build_number to 1.`);
    build_number = 1;
    return (build_number);
  }
  let existingBuildNumbers = tags.map(t => parseInt(t.name.match(/-(\d+)$/)[1]));
  core.debug("Existing build numbers: ", JSON.stringify(existingBuildNumbers, undefined, 2));
  let currentBuildNumber = Math.max(...existingBuildNumbers);
  core.info(`Largest '${prefix}' tag is ${currentBuildNumber}.`);
  build_number = currentBuildNumber + 1;
  return (build_number);
}

async function main() {
    try {
      let allTags = await getAllTags();
      let tagsMatchingPrefix = getTagsMatchingPrefix(allTags, core.getInput('prefix'));
      let build_number = getBuildNumber(tagsMatchingPrefix, core.getInput('prefix'));
      core.info(`New build number for tag: ${build_number}.`);
      core.setOutput("build_number", build_number);
    } catch(err) {
      core.error(err);
      core.setFailed(err);
    }


}



