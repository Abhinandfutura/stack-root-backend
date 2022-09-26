const User = require("../Modal/userSchema");
const argon2 = require("argon2");

const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = "MyKey";
var passwordValidator = require("password-validator");

var schema = new passwordValidator();
schema.is().min(8).is().max(20);
// =============SIGNUP=================================
const signup = async (req, res, next) => {
  const { fullname, email, password } = req.body;

  const ValidatePwd = schema.validate(password);
  if (ValidatePwd) {
    try {
      const emailExist = await User.findOne({ email: email });
      if (emailExist) {
        return res.json({ message: "Email already exist", isError: true });
      }

      const hash = await argon2.hash(password, {
        type: argon2.argon2d,
        memoryCost: 2 ** 16,
        hashLength: 40,
      });

      const user = new User({
        fullname: fullname,
        email: email,
        password: hash,
        accessToken: "",
      });

      const data = await user.save();
      console.log("==========", data);
      res.json({ message: "user Registration Succesfull ", isError: false });
    } catch (err) {
      res.status(401).json({ message: err, isError: true });
    }
  } else {
    res.json({
      message: "password should have min:8 charectors max:20 charectors",
      isError: true,
    });
  }
};

// =================SIGNIN================================
const signin = async (req, res, next) => {
  const { email, password } = req.body;

  const ValidatePwd = schema.validate(password);
  if (ValidatePwd) {
    try {
      const existingUser = await User.findOne({ email: email });
      if (!existingUser) {
        return (
          res
            //   .status(400)
            .json({ message: "User not found.Please signup...", isError: true })
        );
      }
      const verify = await argon2.verify(existingUser.password, password);

      if (!verify) {
        res.json({
          message: "password does not match",
          accessToken: null,
          isError: true,
        });
      } else {
        //token generate......
        const userToken = jwt.sign(
          { email: existingUser.email },
          JWT_SECRET_KEY,
          {
            expiresIn: "24hr",
          }
        );

        res

          // .status(200)
          .json({
            message: "Successfully Logged In",
            _id: existingUser.id,
            fullname: existingUser.fullname,
            accessToken: userToken,
            isError: false,
          });

        const setToken = await User.updateOne(
          { email: email },
          {
            $set: {
              accessToken: userToken,
            },
          }
        );
      }
    } catch (err) {
      res.status(400).json({ message: err, isError: true });
    }
  } else {
    res.json({
      message: "password should have min:8 charectors max:20 charectors",
      isError: true,
    });
  }
};

const verifyToken = (req, res, next) => {
  const jwttoken = req.headers["authorization"];

  token = jwttoken.split(" ")[1];

  if (!token) {
    res.status(404).json({ message: "No token found" });
  }
  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
      res.status(400).json({ message: "invalid Token" });
    }

    req.user = user.email;
  });
  next();
};
const logout = async (req, res, nex) => {
  userEmail = req.user;
  let user;
  try {
    user = await User.findOne({ email: userEmail });
    console.log("ppppppppppp", user);
    if (!user) {
      return res.status(404).json({ message: "User not found", isError: true });
    } else {
      console.log("======================", user);
    }
  } catch (err) {
    return res, json({ message: err, isError: true });
  }

  await User.updateOne(
    { email: userEmail },
    {
      $set: {
        accessToken: "",
      },
    }
  );
  return res
    .status(200)
    .json({ message: "Logout Successfull", isError: false });
};

exports.signup = signup;
exports.signin = signin;
exports.verifyToken = verifyToken;
exports.logout = logout;
