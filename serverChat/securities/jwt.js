import "dotenv/config";
import jwt from "jsonwebtoken";

const signToken = ({ payload, secret = process.env.SECRET_KEY, options = { algorithm: "HS256" } }) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) {
        reject(err); // remove throw
      } else {
        resolve(token);
      }
    });
  });
};

const verifyToken = ({ tokens, secret = process.env.SECRET_KEY }) => {
  return new Promise((resolve, reject) => {
    const token = tokens.split(" ")[1];
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err); // remove throw
      } else {
        resolve(decoded);
      }
    });
  });
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

export { signToken, verifyToken, decodeToken };
