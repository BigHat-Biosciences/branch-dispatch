const core = require('@actions/core');
const github = require('@actions/github');

/**
 * This script is launched after master was pushed. We should wait until VERSION is available in pypi, then 
 * trigger re-runs of all live branches. Those re-runs should bump versions in the other branches.
 */

async function run() {
  try {
    const token = core.getInput('repo-token');
    const targetWorkflow = core.getInput('target-workflow');

    const repoName = github.context.payload.repository.full_name;
    core.info(`Running under ${repoName}`);
    const [owner, repo] = repoName.split('/');

    const octokit = github.getOctokit(token);
    const { data: branches } = await octokit.repos.listBranches({
      owner,
      repo,
    });

    branches.forEach(async b => {
      if (b.name !== 'master') {
        core.info(`Running ${targetWorkflow} for ${b.name}`);
        try {
          const resp = await octokit.actions.createWorkflowDispatch({
            owner,
            repo,
            workflow_id: targetWorkflow,
            ref: b.name,
          });
        } catch (error) {
          core.info(error.stack)
          core.setFailed(error.message);
        }
      }
    })
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
