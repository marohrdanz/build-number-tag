const core = require('@actions/core');
const github = require('@actions/github');

// Define some global variables for this short script
const myToken = core.getInput('token');
const octokit = github.getOctokit(myToken);
const prefix = core.getInput('prefix');
core.debug(`Tag prefix: ${prefix}`);

main();

async function main() {
  try {
    let allTags = await getAllTags();
    let tagsMatchingPrefix = getTagsMatchingPrefix(allTags)
    let build_number = getBuildNumber(tagsMatchingPrefix)
    let tagName = `${prefix}${build_number}`;
    response = await createTag(tagName)
    core.notice(`Created new tag: ${tagName}`);
    core.notice(`Set action outpupt: build_number = ${build_number}`);
    core.setOutput("build_number", build_number);
  } catch(err) {
    core.error(err);
    core.setFailed(err);
  }
}

// Returns list of all tags in repo
async function getAllTags() {
  try {
    const options =  {
      owner: `${process.env.GITHUB_REPOSITORY_OWNER}`,
      repo: `${process.env.GITHUB_REPOSITORY}`.split('/')[1]
    };
    core.debug("Options for getAllTags:");
    core.debug(JSON.stringify(options, null, 4));
    const response = await octokit.rest.repos.listTags(options);
    core.debug("Have response from getting tags")
    let allTags = response.data;
    return allTags;
  } catch (err) {
    core.error("Error getting tags");
    throw err;
  }
}

// Returns list of all input tags that match ${prefix} global variable
function getTagsMatchingPrefix(tags) {
  try {
    const regexString = `${prefix}(\\d+)$`;
    const regex = new RegExp(regexString);
    let tagsMatchingPrefix = tags.filter(t => t.name.match(regex));
    core.debug("Have matching tags")
    return tagsMatchingPrefix;
  } catch (err) {
    core.error("Error getting tags matching prefix");
    throw err;
  }
}

// Determines new build number based on tags and ${prefix} global variable
function getBuildNumber(tags) {
  try {
    let build_number;
    if (tags.length < 1) {
      core.info(`No tags matching prefix '${prefix}'. Setting build number to 1.`);
      build_number = 1;
      return build_number;
    }
    core.debug("Trying to get existing tags")
    let tagsString = JSON.stringify(tags, undefined, 2);
    core.debug(tagsString);
    let existingBuildNumbers = tags.map(t => parseInt(t.name.match(/(\d+)$/)[1]));
    core.debug("Existing build numbers: ", JSON.stringify(existingBuildNumbers, undefined, 2));
    let currentBuildNumber = Math.max(...existingBuildNumbers);
    core.debug(`Largest '${prefix}' tag is ${currentBuildNumber}.`);
    build_number = currentBuildNumber + 1;
    core.info(`Build number: ${build_number}.`);
    return build_number;
  } catch (err) {
    core.error("Error getting build number");
    throw err;
  }
}

// Creates new tag in the repo
async function createTag(tagName) {
  try {
    core.debug(`Creating tag: ${tagName}`);
    const options = {
      owner: `${process.env.GITHUB_REPOSITORY_OWNER}`,
      repo: `${process.env.GITHUB_REPOSITORY}`.split('/')[1],
      ref: `refs/tags/${tagName}`,
      sha: `${process.env.GITHUB_SHA}` 
    }
    core.debug("Options for createTag:");
    core.debug(JSON.stringify(options, null, 4));
    const response = await octokit.rest.git.createRef(options);
    core.debug(response);
    return response;
  } catch (err) {
    core.error("Error creating new tag")
    throw err
  }
}





