// 1. Sign in to get a token
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

const signinData = await signin.json() as {
  token: string;
};

console.log("SIGNIN STATUS:", signin.status);

const token = signinData.token;


// 2. Create organization
const createOrganization = await fetch(
  "http://localhost:3001/api/organizations",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "My Organization",
      description: "This is my organization",
    }),
  }
);

console.log("\nCREATE ORGANIZATION");
console.log("Status:", createOrganization.status);

const createData = await createOrganization.json();

console.log("Response:", createData);


// 3. Get organizations
const getOrganizations = await fetch(
  "http://localhost:3001/api/organizations",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

console.log("\nGET ORGANIZATIONS");
console.log("Status:", getOrganizations.status);

const getData = await getOrganizations.json();

console.log("Response:", getData);