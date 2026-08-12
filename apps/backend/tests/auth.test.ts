const signup = await fetch("http://localhost:3001/api/auth/signup", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "sagar",
    email: "sagar372@gmail.com",
    password: "123456",
  }),
});

console.log("SIGNUP");
console.log("Status:", signup.status);
console.log("Content-Type:", signup.headers.get("content-type"));

const signupData = await signup.text();
console.log("Response:", signupData);


const signin = await fetch("http://localhost:3001/api/auth/signin", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "sagar372@gmail.com",
    password: "123456",
  }),
});

console.log("SIGNIN");
console.log("Status:", signin.status);
console.log("Content-Type:", signin.headers.get("content-type"));

const signinData = await signin.text();
console.log("Response:", signinData);