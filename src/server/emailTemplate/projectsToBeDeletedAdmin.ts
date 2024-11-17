export const projectsToBeDeletedTemplate = `<html>
  <head>
    <title>Inactive projects to be deleted</title>
  </head>
  <body>
    <div>
      <span>{{projectToBeDeleted}} project(s) have been inactive for a 12 months.</span>
      <a href="{{url}}/admin/projects?showOnlyInactive=1">Delete projects here</a>
    </div>
  </body>
</html>`
