let express = require('express')
let { nanoid } = require('nanoid')
let cors = require('cors')
let body = require('body-parser')
let app = express()

app.use(cors())
app.use(body.json())

app.post('/', async (req, res) => {
  const token = req.body.token;
  try {
    res.json({
      "authenticate": true,
      "expirationSeconds": 28800,
      "userID": '1234', // CHANGE ME
      "permissions": {
        "read": {
          "everything": true,
          "queriesByCollection": {}
        },
        "write": {
          "everything": true,
          "queriesByCollection": {}
        }
      }
    })
  } catch (err) {
    console.error(err)
    res.json({
      "authenticate": false,
      "userInfo": err.message
    }) 
  }
})

module.exports = app