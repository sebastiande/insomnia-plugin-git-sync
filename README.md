# ARCHIVED: as the export functionality of Insomnia is broken since some versions (08/2023) this plugin is not further developed and archived. Use the design collections with integrated GIT Sync instead

# Git sync for Insomnia

This plugin can sync service calls of a project to git and pull from it.
Currently, the plugin does not support branches, it only uses the default branch.
Conflicts get solved on overwrite basis only.
You can decide if you want to send your local version to server, or overwrite your local changes with the current server version.
Therefore, it is a good idea to always pull before doing changes.

## Insomnia Documentation:
* https://docs.insomnia.rest/insomnia/introduction-to-plugins

# Usage

## Save project in GIT for the first time

1. Create a GIT Repository on your GIT instance
2. Set Repository URL: click on project name in Insomnia > Set GIT Repository URL
3. Click on project name in Insomnia > Push to GIT Repository

## Import from Server

1. Create a project with the same name as used before
2. Set Repository URL: click on project name in Insomnia > Set GIT Repository URL
3. Click on project name in Insomnia > Pull from GIT Repository
