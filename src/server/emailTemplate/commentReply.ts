export const commentReply = `<html>
  <head>
    <title>{{commentAuthorName}} replied to your comment</title>
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
