import prisma from "../src/index.js";
async function main() {
  console.log("Seeding database...");

  // Clean up existing data
  await prisma.jobApplication.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.job.deleteMany({});

  // 1. Create fake users with profiles
  const user1 = await prisma.user.create({
    data: {
      id: "user-1",
      name: "Alice Software",
      email: "alice@example.com",
      emailVerified: true,
      profile: {
        create: {
          targetRole: "Frontend Engineer",
          yearsOfExperience: 3,
          location: "San Francisco, CA",
          bio: "I build great user interfaces.",
        },
      },
    },
    include: {
      profile: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: "user-2",
      name: "Bob Backend",
      email: "bob@example.com",
      emailVerified: true,
      profile: {
        create: {
          targetRole: "Backend Engineer",
          yearsOfExperience: 5,
          location: "New York, NY",
          bio: "I love databases and distributed systems.",
        },
      },
    },
    include: {
      profile: true,
    },
  });

  // 2. Create fake jobs
  const job1 = await prisma.job.create({
    data: {
      title: "Senior Frontend Engineer",
      company: "TechNova",
      location: "San Francisco, CA",
      workEnvironment: "hybrid",
      description: "We are looking for a senior frontend engineer with React experience.",
      industry: "Technology",
      experienceLevel: "senior",
      companySize: "scale_up",
      salaryMin: 140000,
      salaryMax: 180000,
      currency: "USD",
      skills: ["React", "TypeScript", "CSS"],
      isActive: true,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: "Backend Developer",
      company: "DataCorp",
      location: "Remote",
      workEnvironment: "remote",
      description: "Join our core infra team.",
      industry: "Data Management",
      experienceLevel: "mid",
      companySize: "enterprise",
      salaryMin: 120000,
      salaryMax: 160000,
      currency: "USD",
      skills: ["Node.js", "PostgreSQL", "Go"],
      isActive: true,
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: "Fullstack Engineer",
      company: "StartupZ",
      location: "Remote",
      workEnvironment: "remote",
      description: "Fast-paced environment looking for a generalist.",
      industry: "Technology",
      experienceLevel: "mid",
      companySize: "startup",
      salaryMin: 100000,
      salaryMax: 140000,
      currency: "USD",
      skills: ["React", "Node.js", "TypeScript"],
      isActive: true,
    },
  });

  // 3. Create job applications
  await prisma.jobApplication.create({
    data: {
      profileId: user1.profile!.id,
      jobId: job1.id,
      company: job1.company,
      roleTitle: job1.title,
      stage: "technical",
      status: "active",
      fitScore: 90,
      appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    },
  });

  await prisma.jobApplication.create({
    data: {
      profileId: user1.profile!.id,
      jobId: job3.id,
      company: job3.company,
      roleTitle: job3.title,
      stage: "applied",
      status: "active",
      fitScore: 85,
      appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    },
  });

  await prisma.jobApplication.create({
    data: {
      profileId: user2.profile!.id,
      jobId: job2.id,
      company: job2.company,
      roleTitle: job2.title,
      stage: "offer",
      status: "active",
      fitScore: 95,
      appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days ago
    },
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
