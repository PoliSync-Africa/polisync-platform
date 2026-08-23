const prisma = require("./User");

const Election = {
  findMany: (args = {}) => prisma.election.findMany(args),

  findUnique: (args) => prisma.election.findUnique(args),

  create: (args) => prisma.election.create(args),

  update: (args) => prisma.election.update(args),

  delete: (args) => prisma.election.delete(args),

  count: (args = {}) => prisma.election.count(args),
};

module.exports = Election;
