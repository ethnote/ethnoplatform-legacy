export const deleteProjectWarningTemplate = `<html>
  <head>
    <title>You're team leader of a inactive project. {{projectName}} will be deleted in {{remainingDays}} days if it remains idle.</title>
  </head>
  <body>
    <div>
      <span style='font-weight: bold;'>You're team leader of a inactive project. {{projectName}} will be deleted in {{remainingDays}} days if it remains inactive. Click on the link to access the project.</span>
      <span>{{link}}</span>
    </div>
  </body>
</html>`
