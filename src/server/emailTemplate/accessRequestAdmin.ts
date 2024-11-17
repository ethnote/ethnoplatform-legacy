export const accessRequestAdminTemplate = `<html>
  <head>
    <title>New acccess request from {{fullName}}</title>
  </head>
  <body>
    <div>
      <span>New acccess request from {{fullName}} <{{email}}></span>
      <a href="{{url}}/admin/access-requests">Accept here</a>
    </div>
  </body>
</html>`
