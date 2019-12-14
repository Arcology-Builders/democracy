// From https://acode.ninja/deploy-a-react-application-to-heroku/
const express = require('express')
const path = require('path')
const app = express()

app.use(express.static(path.join('packages','web','build')))

// make the application listen on the port given by Heroku
app.listen(
      process.env.PORT,
          () => console.log(`listening on port ${process.env.PORT}`)
)
