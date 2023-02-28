const core = require('@actions/core');
const github = require('@actions/github');

const myToken = core.getInput('token');
const octokit = github.getOctokit(myToken);
const repo_name = github.context.payload.repository.name;
const repo_owner = github.context.payload.repository.owner.name;
const sha = github.context.payload.after;
const payload = JSON.stringify(github.context.payload, undefined, 2)
const prefix = core.getInput('prefix');
console.log(`The event payload: ${payload}`);

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

function getTagsMatchingPrefix(tags ) {
  const regexString = `${prefix}(\\d+)$`;
  const regex = new RegExp(regexString);
  let tagsMatchingPrefix = tags.filter(t => t.name.match(regex));
  return (tagsMatchingPrefix);
}

function getBuildNumber(tags) {
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

async function createTag(tagName) {
  core.debug(`Creating tag: ${tagName}`);
  const options = {
    owner: repo_owner,
    repo: repo_name,
    ref: tagName,
    sha: sha
  }
  const response = await octokit.rest.git.createRef(options);
  core.debug("After creating tag?")
  core.debug(response)
  return(response)
}

async function main() {
    try {
      let allTags = await getAllTags();
      let tagsMatchingPrefix = getTagsMatchingPrefix(allTags)
      let build_number = getBuildNumber(tagsMatchingPrefix)
      core.info(`New build number for tag: ${build_number}.`);
      core.setOutput("build_number", build_number);
      let tagName = `${prefix}${build_number}`;
      response = await createTag(tagName)
      core.debug("after creating tag")
    } catch(err) {
      core.error(err);
      core.setFailed(err);
    }


}



