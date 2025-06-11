import bcrypt from "bcrypt";

const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) {
        reject(err); // không cần throw
      } else {
        resolve(hash);
      }
    });
  });
};

const comparePassword = (password, hash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, result) => {
      if (err) {
        reject(err); // không cần throw
      } else {
        resolve(result);
      }
    });
  });
};

export { hashPassword, comparePassword };
