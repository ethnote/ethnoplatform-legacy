export const commentOnYourNote = `<html>
  <head>
    <title>{{commentAuthorName}} commented on your note</title>
  </head>
  <body>
    <div>
      <span style='font-weight: bold;'>{{commentAuthorName}}:</span>
      <span>{{comment}}</span>
      <br/>
      <span>Click here to see comment and reply: <a href='{{replyLink}}'>{{replyLink}}</a></span>
      </div>
  </body>
</html>`
