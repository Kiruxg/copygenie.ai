// Basic model structure without database for now
const ErrorLog = {
  create: async (errorLog) => {
    console.log("Error logged:", errorLog);
    return errorLog;
  },
};

const User = {
  findById: async (id) => {
    console.log("User lookup:", id);
    return null;
  },
};

const Description = {
  create: async (description) => {
    console.log("Description created:", description);
    return description;
  },
  countDocuments: async (query) => {
    console.log("Count query:", query);
    return 0;
  },
};

module.exports = {
  ErrorLog,
  User,
  Description,
};
