githubapi is a Flask Blueprint used to proxy git requests as the authorized user given the "GIT_TOKEN" stored in environment variables

To use, log in to your github account and go to https://github.com/settings/tokens and generate a new token. Add the new token to your
environment variables as GIT_TOKEN.

The Git repository being used is defined within githubapi as GIT_OWNER and GIT_REPO.

To list the branches access the url /github/branches
To download a branch; access /branches/download?ref=the_branch_ref_name

To list the tags access the url /github/versions
To download a tag; access /versions/download?url=url_to_download_tag

Each of the downloads returns an encrypted stream of the tag/branch.  To decrypt the stream use the deployment_installer.


