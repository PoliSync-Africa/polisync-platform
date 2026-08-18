const register = async (userData) => {
  const {
    fullName,
    email,
    phone,
    password,
    politicalParty,
    region,
    constituency
  } = userData;

  if (!fullName || !email || !phone || !password) {
    return {
      success: false,
      message: "Required fields are missing."
    };
  }

  return {
    success: true,
    message: "Registration request received.",
    user: {
      fullName,
      email,
      phone,
      politicalParty: politicalParty || "Not Selected",
      region: region || "Not Selected",
      constituency: constituency || "Not Selected",
      role: "pending-approval"
    }
  };
};

module.exports = register;
