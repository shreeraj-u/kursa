import prisma from "../src/index.js";
async function main() {
    console.log("Seeding database...");

    const testUserId = "W3gg4yBeKTB6xFPiJMR4MjAaBald4AuH";

    // Clean up existing data for idempotency
    await prisma.jobApplication.deleteMany({ where: { profile: { userId: testUserId } } });
    await prisma.profile.deleteMany({ where: { userId: testUserId } });
    await prisma.job.deleteMany({});
    // Check if test user exists (they should have created it via UI)
    let testUser = await prisma.user.findUnique({
        where: { id: testUserId }
    });

    if (!testUser) {
        console.warn("Test user not found in the database. Please create a user with email test@gmail.com and password test1234 through the app first!");
        // We will create a fallback just in case, but they won't be able to log in with password
        // without the proper better-auth account hashing.
        testUser = await prisma.user.create({
            data: {
                id: testUserId,
                name: "test",
                email: "test@gmail.com",
                emailVerified: true,
            }
        });
    }

    // 1. Create a profile for the test user with populated skills and goals
    const profile = await prisma.profile.create({
        data: {
            userId: testUserId,
            targetRole: "Frontend Engineer",
            yearsOfExperience: 3,
            location: "San Francisco, CA",
            bio: "I build great user interfaces.",
            skills: {
                create: [
                    { name: "React", category: "technical", proficiencyLevel: "advanced", confidenceRating: 4, lastUsedDate: new Date() },
                    { name: "TypeScript", category: "technical", proficiencyLevel: "intermediate", confidenceRating: 3, lastUsedDate: new Date() },
                    { name: "GraphQL", category: "technical", proficiencyLevel: "beginner", confidenceRating: 2, lastUsedDate: new Date() }
                ]
            },
            learningGoals: {
                create: [
                    { skillName: "GraphQL", targetProficiency: "intermediate", status: "LEARNING", deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) },
                    { skillName: "Next.js", targetProficiency: "advanced", status: "COMPLETED", deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
                    { skillName: "WebSockets", targetProficiency: "beginner", status: "PLANNED", deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60) }
                ]
            },
            workHistories: {
                create: [
                    { companyName: "TechCorp", roleTitle: "Frontend Developer", startDate: new Date("2021-01-01"), endDate: new Date("2023-01-01"), isCurrent: false },
                    { companyName: "Innovate LLC", roleTitle: "Software Engineer", startDate: new Date("2023-02-01"), isCurrent: true }
                ]
            }
        }
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

    // 3. Create job applications for the test user
    await prisma.jobApplication.create({
        data: {
            profileId: profile.id,
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
            profileId: profile.id,
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
            profileId: profile.id,
            jobId: job2.id,
            company: job2.company,
            roleTitle: job2.title,
            stage: "offer",
            status: "active",
            fitScore: 95,
            appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days ago
        },
    });

    console.log("Database seeded successfully with test user data.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
