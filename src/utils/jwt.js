import jwt from "jsonwebtoken"

const secretKey = "6XDEPcTivqgNdIvsIESp3GahewOrRvn9jw3XowBsLhM"

class JWT {
  constructor() {
    if (!JWT.instance) {
      JWT.instance = this
    }

    return JWT.instance
  }

  generate(payload) {
    const token = jwt.sign(payload, secretKey, {
      expiresIn: "2d",
      algorithm: "HS256",
    })

    return token
  }

  check(token) {
    const decoded = jwt.verify(token, secretKey, {
      expiresIn: "2d",
      algorithm: "HS256",
    })

    return decoded
  }
}

const instance = new JWT()
Object.freeze(instance)

export default instance
