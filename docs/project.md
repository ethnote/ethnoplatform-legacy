---
title: 'Project'
position: 3.0
category: 'Project'
---

# Project

All fieldnotes are contained within a project. A project can be used by one person, or can be shared with a team by adding their email addresses in the project settings. The team has two roles: team leader and member. The member role can only edit their own fieldnotes, while the team leader can edit all fieldnotes in the project.

The project page consist of three tabs:

- [**Fielnotes:**](/docs/fieldnotes) Overview of all the fieldnotes in the project
- [**Fielnote Templates:**](/docs/template) The different templates used in the project
- [**Settings:**](/docs/project-settings) The settings for this specific project

![Project Page](/project-page.png 'Project Page')

## Automatic deletion of projects

A warning will be sent to all team leaders 90, 30 and 1 day before the project will be deleted. There will be a buffer for further 30 days. When the day of deletion has passed, an email will be sent to the admins and the project can be deleted. The check is done by a cron job that runs every day. Google Cloud Scheduler is used to run the cron job.
