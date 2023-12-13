import { createServer } from "http"
import { MongoClient } from "mongodb"
import jwt from "./utils/jwt.js"

const port = 3000

let client = null
let db = null
let userCollection = null

async function init() {
  client = new MongoClient("mongodb://localhost:27017")
  await client.connect()
  db = client.db("node-auth")
  userCollection = db.collection("users")
}

await init()

const server = createServer(function (req, res) {
  const { method, url, headers } = req

  // login
  if (method === "POST" && url === "/auth/login") {
    let body = []

    req
      .on("data", function (chunk) {
        body.push(chunk)
      })
      .on("end", async function () {
        body = Buffer.concat(body).toString()
        body = JSON.parse(body)

        const user = await userCollection.findOne({
          email: body.email,
          password: body.password,
        })

        if (!user) {
          res.writeHead(401, { "Content-Type": "application/json" })
          res.end("Unauthorized")
          return
        }

        const token = jwt.generate({ ...user, password: undefined })

        res.writeHead(201, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ token }))
      })

    return
  }

  // signup
  if (method === "POST" && url === "/auth/signup") {
    let body = []

    req
      .on("data", function (chunk) {
        body.push(chunk)
      })
      .on("end", async function () {
        body = Buffer.concat(body).toString()
        body = JSON.parse(body)
        const user = {
          email: body.email,
          password: body.password,
          role: "writer",
          permissions: ["write:post", "edit:post"],
          attributes: [
            "access:department:marketing",
            "access:department:sales",
            "read:sensitive-data",
            "access:client:clientX",
          ],
        }

        const result = await userCollection.insertOne(user)

        const token = jwt.generate({
          _id: result.insertedId,
          ...user,
          password: undefined,
        })

        res.writeHead(201, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ token }))
      })

    return
  }

  if (method === "GET" && url === "/protected") {
    if (!headers["authorization"]) {
      res.writeHead(401, "Unauthorized")
      res.end("Unauthorized")
      return
    }
    const token = headers["authorization"]
    const decoded = jwt.check(token)

    if (!decoded) {
      res.writeHead(401, "Unauthorized")
      res.end("Unauthorized")
      return
    }

    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ message: "access granted" }))
    return
  }

  res.end("working")
})

server.listen(port, function () {
  console.log(`server is listening on ${port}`)
})
