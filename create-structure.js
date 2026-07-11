const fs = require("fs");
const path = require("path");

const structure = {
  frontend: {
    pages: {
      auth: {
        "signup.html": "",
        "login.html": "",
        "otp-verify.html": "",
        "forgot-password.html": "",
        "reset-password.html": "",
      },

      admin: {
        "admin-login.html": "",
        "dashboard.html": "",
        "user-management.html": "",
      },
    },

    assets: {
      css: {
        "style.css": "",
        "auth.css": "",
        "admin.css": "",
      },

      js: {
        auth: {
          "signup.js": "",
          "login.js": "",
          "otp.js": "",
          "resetPassword.js": "",
        },

        admin: {
          "userManagement.js": "",
        },

        common: {
          "api.js": "",
          "session.js": "",
        },
      },

      images: {},
    },

    "index.html": "",
  },
};

function createStructure(basePath, obj) {
  for (const name in obj) {
    const fullPath = path.join(basePath, name);

    if (typeof obj[name] === "object") {
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log("📁", fullPath);
      }

      createStructure(fullPath, obj[name]);
    } else {
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, obj[name]);
        console.log("📄", fullPath);
      }
    }
  }
}

createStructure(process.cwd(), structure);

console.log("\n✅ Frontend folder structure created successfully.");