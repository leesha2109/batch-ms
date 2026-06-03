import fs from "fs";
import fetch from "node-fetch";

const cookies = fs
  .readFileSync("cookies.txt", "utf8")
  .split("\n")
  .filter(Boolean)
  .slice(1)
  .map((line) => line.split("\t"))
  .map((cols) => `${cols[5]}=${cols[6]}`)
  .join("; ");

const base = "http://localhost:3000";
const userId = "6a1fc25fb4f9c52ff0ee56ab";
const patchBody = JSON.stringify({
  name: "Maleesha F",
  email: "maleeshaferdinandaz@gmail.com",
  role: "coordinator",
  isActive: true,
});

async function run() {
  const patchRes = await fetch(`${base}/api/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
    },
    body: patchBody,
  });
  console.log("PATCH", patchRes.status);
  console.log(await patchRes.text());

  const deleteRes = await fetch(`${base}/api/users/${userId}`, {
    method: "DELETE",
    headers: {
      Cookie: cookies,
    },
  });
  console.log("DELETE", deleteRes.status);
  console.log(await deleteRes.text());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
