const core = require('@actions/core');
const github = require('@actions/github');

// Define some global variables for this short script
const myToken = core.getInput('token');
const octokit = github.getOctokit(myToken);
const repo_name = github.context.payload.repository.name;
const repo_owner = github.context.payload.repository.owner.name;
const sha = github.context.payload.after;
const prefix = core.getInput('prefix');

const payload = JSON.stringify(github.context.payload, undefined, 2)
core.debug(`The event payload: ${payload}`);

main();

async function main() {
  try {
    let allTags = await getAllTags();
    let tagsMatchingPrefix = getTagsMatchingPrefix(allTags)
    let build_number = getBuildNumber(tagsMatchingPrefix)
    let tagName = `${prefix}${build_number}`;
    response = await createTag(tagName)
    core.notice(`Created new tag: ${tagName}`);
    core.notice(`Set outpupt build_number: ${build_number}`);
    core.setOutput("build_number", build_number);
  } catch(err) {
    core.error(err);
    core.setFailed(err);
  }
}

// Returns list of all tags in repo
async function getAllTags() {
  const options =  {
    owner: repo_owner,
    repo: repo_name
  };
  core.debug("Options for getAllTags:");
  core.debug(JSON.stringify(options, null, 4));
  const response = await octokit.rest.repos.listTags(options);
  allTags = response.data;
  return allTags;
}

// Returns list of all input tags that match ${prefix} global variable
function getTagsMatchingPrefix(tags) {
  const regexString = `${prefix}(\\d+)$`;
  const regex = new RegExp(regexString);
  let tagsMatchingPrefix = tags.filter(t => t.name.match(regex));
  return tagsMatchingPrefix;
}

// Determines new build number based on tags and ${prefix} global variable
function getBuildNumber(tags) {
  let build_number;
  if (tags.length < 1) {
    core.info(`No tags matching prefix '${prefix}'. Setting build number to 1.`);
    build_number = 1;
    return build_number;
  }
  let existingBuildNumbers = tags.map(t => parseInt(t.name.match(/-(\d+)$/)[1]));
  core.debug("Existing build numbers: ", JSON.stringify(existingBuildNumbers, undefined, 2));
  let currentBuildNumber = Math.max(...existingBuildNumbers);
  core.debug(`Largest '${prefix}' tag is ${currentBuildNumber}.`);
  build_number = currentBuildNumber + 1;
  core.info(`Build number: ${build_number}.`);
  return build_number;
}

// Creates new tag in the repo
async function createTag(tagName) {
  core.debug(`Creating tag: ${tagName}`);
  const options = {
    owner: repo_owner,
    repo: repo_name,
    ref: `refs/tags/${tagName}`,
    sha: sha
  }
  core.debug("Options for createTag:");
  core.debug(JSON.stringify(options, null, 4));
  const response = await octokit.rest.git.createRef(options);
  core.debug(response);
  return response;
}





