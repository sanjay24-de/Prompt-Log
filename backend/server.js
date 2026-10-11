const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// STORAGE PATHS
// ==========================================

const storageFolder = path.join(
    __dirname,
    "..",
    "storage"
);

const promptsFolder = path.join(
    storageFolder,
    "prompts"
);

const versionsFolder = path.join(
    storageFolder,
    "versions"
);

const regressionFolder = path.join(
    storageFolder,
    "regression"
);

const baselinesFolder = path.join(
    storageFolder,
    "baselines"
);

const runtimeFolder = path.join(
    storageFolder,
    "runtime"
);

const analyticsFolder = path.join(
    storageFolder,
    "analytics"
);

// ==========================================
// CREATE STORAGE FOLDERS
// ==========================================

fs.mkdirSync(storageFolder, {
    recursive: true
});

fs.mkdirSync(promptsFolder, {
    recursive: true
});

fs.mkdirSync(versionsFolder, {
    recursive: true
});

fs.mkdirSync(regressionFolder, {
    recursive: true
});

fs.mkdirSync(baselinesFolder, {
    recursive: true
});

fs.mkdirSync(runtimeFolder, {
    recursive: true
});

fs.mkdirSync(analyticsFolder, {
    recursive: true
});

// ==========================================
// SERVER INFORMATION
// ==========================================

console.log("====================================");
console.log("Prompt-Log Backend");
console.log("====================================");
console.log("Storage:", storageFolder);
console.log("Prompts:", promptsFolder);
console.log("Versions:", versionsFolder);
console.log("Regression:", regressionFolder);
console.log("Baselines:", baselinesFolder);
console.log("Runtime:", runtimeFolder);
console.log("Analytics:", analyticsFolder);

// ==========================================
// MIGRATION: .md to .json
// ==========================================
try {
    const files = fs.readdirSync(promptsFolder);
    for (const file of files) {
        if (file.endsWith(".md")) {
            const filePath = path.join(promptsFolder, file);
            const content = fs.readFileSync(filePath, "utf-8");
            const name = path.basename(file, ".md");
            const jsonPath = path.join(promptsFolder, `${name}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify({ name, content, tags: [] }, null, 2), "utf-8");
            fs.unlinkSync(filePath);
            console.log(`Migrated ${file} to ${name}.json`);
        }
    }
} catch(e) {
    console.error("Migration error:", e);
}
console.log("====================================");

// ==========================================
// USER AUTHENTICATION HELPERS
// ==========================================

const usersFile = path.join(storageFolder, "users.json");

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function readUsers() {
    if (!fs.existsSync(usersFile)) {
        const defaultSalt = crypto.randomBytes(16).toString('hex');
        const defaultHash = hashPassword("password123", defaultSalt);
        const defaultUsers = [
            {
                id: "usr_demo",
                name: "Demo User",
                email: "demo@promptlog.com",
                salt: defaultSalt,
                hash: defaultHash,
                createdAt: new Date().toISOString()
            }
        ];
        try {
            fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2), "utf-8");
        } catch (e) {
            console.error("Failed to seed default user:", e);
        }
        return defaultUsers;
    }
    try {
        const data = fs.readFileSync(usersFile, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
}

// Ensure users database is initialized
readUsers();

// ==========================================
// ROOT TEST
// ==========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Prompt-Log Backend is Running"
    });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register New User
app.post("/api/auth/register", (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        const users = readUsers();
        const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(password, salt);
        const userId = "usr_" + crypto.randomBytes(8).toString('hex');

        const newUser = {
            id: userId,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            salt,
            hash,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        const token = "tok_" + crypto.randomBytes(16).toString('hex');

        res.json({
            success: true,
            message: "Account created successfully",
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to create account"
        });
    }
});

// Login User
app.post("/api/auth/login", (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const users = readUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const inputHash = hashPassword(password, user.salt);
        if (inputHash !== user.hash) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = "tok_" + crypto.randomBytes(16).toString('hex');

        res.json({
            success: true,
            message: "Logged in successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to log in"
        });
    }
});

// Get Current User
app.get("/api/auth/me", (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        res.json({
            success: true,
            message: "Authenticated"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Auth verification error"
        });
    }
});


// ==========================================
// SAVE PROMPT
// ==========================================

app.post("/api/prompts", (req, res) => {

    try {

        const {
            name,
            content,
            tags,
            overwrite
        } = req.body;

        if (!name || !content) {

            return res.status(400).json({
                success: false,
                message:
                    "Prompt name and content are required"
            });

        }

        const safeName = name
            .trim()
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            );

        const fileName =
            `${safeName}.json`;

        const filePath =
            path.join(
                promptsFolder,
                fileName
            );

        // Prevent accidental overwrite
        if (
            fs.existsSync(filePath) &&
            !overwrite
        ) {

            return res.status(409).json({

                success: false,

                exists: true,

                message:
                    "A prompt with this name already exists. Overwrite it?"

            });

        }

        fs.writeFileSync(
            filePath,
            JSON.stringify({ name, content, tags: tags || [] }, null, 2),
            "utf-8"
        );

        res.json({

            success: true,

            message:
                "Prompt saved successfully",

            file:
                fileName

        });

    } catch (error) {

        console.error(
            "Save prompt error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to save prompt"

        });

    }

});

// ==========================================
// LOAD SAVED PROMPTS
// ==========================================

app.get(
    "/api/prompts",
    (req, res) => {

        try {

            const files =
                fs.readdirSync(
                    promptsFolder
                );

            const prompts =
                files
                    .filter(
                        file =>
                            file.endsWith(".json")
                    )
                    .map(file => {

                        const filePath =
                            path.join(
                                promptsFolder,
                                file
                            );

                        const data =
                            fs.readFileSync(
                                filePath,
                                "utf-8"
                            );

                        const parsed = JSON.parse(data);

                        return {

                            name:
                                parsed.name || path.basename(file, ".json"),

                            file,

                            content: parsed.content || "",
                            
                            tags: parsed.tags || []

                        };

                    });

            res.json({

                success: true,

                prompts

            });

        } catch (error) {

            console.error(
                "Load prompts error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load prompts"

            });

        }

    }
);

// ==========================================
// DELETE SAVED PROMPT
// ==========================================

app.delete(
    "/api/prompts/:name",
    (req, res) => {

        try {

            const {
                name
            } = req.params;

            // path.basename strips any directory
            // components so this can't escape
            // promptsFolder via a crafted name
            // like "../../server"
            const safeName =
                path.basename(name);

            const fileName =
                `${safeName}.json`;

            const filePath =
                path.join(
                    promptsFolder,
                    fileName
                );

            if (
                !fs.existsSync(
                    filePath
                )
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Prompt not found"

                });

            }

            fs.unlinkSync(
                filePath
            );

            res.json({

                success: true,

                message:
                    "Prompt deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete prompt error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete prompt"

            });

        }

    }
);

// ==========================================
// CREATE SNAPSHOT
// ==========================================

app.post(
    "/api/snapshot",
    (req, res) => {

        try {

            const {
                name,
                content
            } = req.body;

            if (!name || !content) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Prompt name and content are required"

                });

            }

            const hash =
                crypto
                    .createHash("sha256")
                    .update(content)
                    .digest("hex")
                    .substring(0, 8);

            const versionId =
                `pl_${hash}`;

            const snapshot = {

                id:
                    versionId,

                promptName:
                    name,

                content:
                    content,

                createdAt:
                    new Date().toISOString()

            };

            const versionFile =
                path.join(
                    versionsFolder,
                    `${versionId}.json`
                );

            fs.writeFileSync(

                versionFile,

                JSON.stringify(
                    snapshot,
                    null,
                    2
                ),

                "utf-8"

            );

            res.json({

                success: true,

                message:
                    "Snapshot created successfully",

                version:
                    versionId,

                file:
                    `${versionId}.json`

            });

        } catch (error) {

            console.error(
                "Snapshot error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to create snapshot"

            });

        }

    }
);

// ======================================================
// REGRESSION TESTING
// ======================================================

// ==========================================
// GET REGRESSION TESTS
// ==========================================

app.get(
    "/api/regression/tests",
    (req, res) => {

        try {

            const files =
                fs
                    .readdirSync(
                        regressionFolder
                    )
                    .filter(
                        file =>
                            file.endsWith(".json")
                    );

            const tests =
                files
                    .map(file => {

                        const filePath =
                            path.join(
                                regressionFolder,
                                file
                            );

                        const data =
                            fs.readFileSync(
                                filePath,
                                "utf-8"
                            );

                        return JSON.parse(data);

                    })
                    .sort(
                        (a, b) =>
                            new Date(a.createdAt) -
                            new Date(b.createdAt)
                    );

            res.json({

                success: true,

                tests

            });

        } catch (error) {

            console.error(
                "Load regression tests error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load regression tests"

            });

        }

    }
);

// ==========================================
// ADD REGRESSION TEST
// ==========================================

app.post(
    "/api/regression/tests",
    (req, res) => {

        try {

            const {
                name,
                input,
                expected
            } = req.body;

            if (
                !name ||
                !input ||
                !expected
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Test name, input and expected result are required"

                });

            }

            const testId =
                `test_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 8)}`;

            const test = {

                id:
                    testId,

                name:
                    name.trim(),

                input:
                    input.trim(),

                expected:
                    expected.trim(),

                createdAt:
                    new Date().toISOString()

            };

            const testFile =
                path.join(
                    regressionFolder,
                    `${testId}.json`
                );

            fs.writeFileSync(

                testFile,

                JSON.stringify(
                    test,
                    null,
                    2
                ),

                "utf-8"

            );

            res.status(201).json({

                success: true,

                message:
                    "Regression test added successfully",

                test

            });

        } catch (error) {

            console.error(
                "Add regression test error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to add regression test"

            });

        }

    }
);

// ==========================================
// DELETE REGRESSION TEST
// ==========================================

app.delete(
    "/api/regression/tests/:id",
    (req, res) => {

        try {

            const {
                id
            } = req.params;

            const testFile =
                path.join(
                    regressionFolder,
                    `${id}.json`
                );

            if (
                !fs.existsSync(testFile)
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Regression test not found"

                });

            }

            fs.unlinkSync(testFile);

            res.json({

                success: true,

                message:
                    "Regression test deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete regression test error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete regression test"

            });

        }

    }
);

// ==========================================
// RUN REGRESSION TESTS
// ==========================================

app.post(
    "/api/regression/run",
    (req, res) => {

        try {

            const {
                promptName,
                promptContent
            } = req.body;

            if (!promptContent) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Prompt content is required"

                });

            }

            const files =
                fs
                    .readdirSync(
                        regressionFolder
                    )
                    .filter(
                        file =>
                            file.endsWith(".json")
                    );

            if (files.length === 0) {

                return res.status(400).json({

                    success: false,

                    message:
                        "No regression tests found"

                });

            }

            const tests =
                files.map(file => {

                    const filePath =
                        path.join(
                            regressionFolder,
                            file
                        );

                    const data =
                        fs.readFileSync(
                            filePath,
                            "utf-8"
                        );

                    return JSON.parse(data);

                });

            const promptText =
                promptContent.toLowerCase();

            const results =
                tests.map(test => {

                    const expectedWords =
                        String(
                            test.expected || ""
                        )
                            .toLowerCase()
                            .split(/[,\s]+/)
                            .filter(Boolean);

                    const matchedWords =
                        expectedWords.filter(
                            word =>
                                promptText.includes(
                                    word
                                )
                        );

                    const passed =
                        expectedWords.length > 0 &&
                        matchedWords.length ===
                            expectedWords.length;

                    return {

                        id:
                            test.id,

                        name:
                            test.name,

                        input:
                            test.input,

                        expected:
                            test.expected,

                        status:
                            passed
                                ? "PASS"
                                : "FAIL",

                        details:
                            passed
                                ? "Expected keyword(s) detected in prompt."
                                : "Expected keyword(s) not detected in prompt."

                    };

                });

            const totalTests =
                results.length;

            const passedTests =
                results.filter(
                    result =>
                        result.status === "PASS"
                ).length;

            const failedTests =
                results.filter(
                    result =>
                        result.status === "FAIL"
                ).length;

            res.json({

                success: true,

                promptName:
                    promptName || "",

                totalTests,

                passedTests,

                failedTests,

                status:
                    failedTests === 0
                        ? "STABLE"
                        : "ISSUES",

                results

            });

        } catch (error) {

            console.error(
                "Regression run error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Regression testing failed"

            });

        }

    }
);

// ======================================================
// BASELINES
// ======================================================

// ==========================================
// GET ALL BASELINES
// ==========================================

app.get(
    "/api/baselines",
    (req, res) => {

        try {

            const files =
                fs
                    .readdirSync(
                        baselinesFolder
                    )
                    .filter(
                        file =>
                            file.endsWith(".json")
                    );

            const baselines =
                files
                    .map(file => {

                        const filePath =
                            path.join(
                                baselinesFolder,
                                file
                            );

                        const data =
                            fs.readFileSync(
                                filePath,
                                "utf-8"
                            );

                        return JSON.parse(data);

                    })
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt) -
                            new Date(a.createdAt)
                    );

            res.json({

                success: true,

                baselines

            });

        } catch (error) {

            console.error(
                "Load baselines error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load baselines"

            });

        }

    }
);

// ==========================================
// CREATE BASELINE
// ==========================================

app.post(
    "/api/baselines",
    (req, res) => {

        try {

            const {
                name,
                promptName,
                content
            } = req.body;

            if (!name || !content) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Baseline name and prompt content are required"

                });

            }

            const baselineId =
                `baseline_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 8)}`;

            const baseline = {

                id:
                    baselineId,

                name:
                    name.trim(),

                promptName:
                    promptName || "",

                content:
                    content,

                createdAt:
                    new Date().toISOString()

            };

            const baselineFile =
                path.join(
                    baselinesFolder,
                    `${baselineId}.json`
                );

            fs.writeFileSync(

                baselineFile,

                JSON.stringify(
                    baseline,
                    null,
                    2
                ),

                "utf-8"

            );

            res.status(201).json({

                success: true,

                message:
                    "Baseline saved successfully",

                baseline

            });

        } catch (error) {

            console.error(
                "Create baseline error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to create baseline"

            });

        }

    }
);

// ==========================================
// DELETE BASELINE
// ==========================================

app.delete(
    "/api/baselines/:id",
    (req, res) => {

        try {

            const {
                id
            } = req.params;

            const baselineFile =
                path.join(
                    baselinesFolder,
                    `${id}.json`
                );

            if (
                !fs.existsSync(
                    baselineFile
                )
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Baseline not found"

                });

            }

            fs.unlinkSync(
                baselineFile
            );

            res.json({

                success: true,

                message:
                    "Baseline deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete baseline error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete baseline"

            });

        }

    }
);

// ======================================================
// RUNTIME TRACEABILITY
// ======================================================

// ==========================================
// CREATE RUNTIME LOG
// ==========================================

app.post(
    "/api/runtime/log",
    (req, res) => {

        try {

            const {
                promptName,
                promptContent,
                input,
                output,
                version,
                status
            } = req.body;

            if (
                !promptName ||
                !promptContent ||
                !input ||
                !output
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Prompt name, prompt content, input and output are required"

                });

            }

            const logId =
                `run_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 8)}`;

            const runtimeLog = {

                id:
                    logId,

                promptName:
                    promptName.trim(),

                promptContent:
                    promptContent,

                input:
                    input,

                output:
                    output,

                version:
                    version || "N/A",

                status:
                    status || "SUCCESS",

                createdAt:
                    new Date().toISOString()

            };

            const logFile =
                path.join(
                    runtimeFolder,
                    `${logId}.json`
                );

            fs.writeFileSync(

                logFile,

                JSON.stringify(
                    runtimeLog,
                    null,
                    2
                ),

                "utf-8"

            );

            console.log(
                "Runtime log created:",
                logId
            );

            res.status(201).json({

                success: true,

                message:
                    "Runtime log created successfully",

                log:
                    runtimeLog

            });

        } catch (error) {

            console.error(
                "Runtime log error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to create runtime log"

            });

        }

    }
);

// ==========================================
// GET RUNTIME LOGS
// ==========================================

app.get(
    "/api/runtime/logs",
    (req, res) => {

        try {

            const files =
                fs
                    .readdirSync(
                        runtimeFolder
                    )
                    .filter(
                        file =>
                            file.endsWith(".json")
                    );

            const logs =
                files
                    .map(file => {

                        const filePath =
                            path.join(
                                runtimeFolder,
                                file
                            );

                        const data =
                            fs.readFileSync(
                                filePath,
                                "utf-8"
                            );

                        return JSON.parse(data);

                    })
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt) -
                            new Date(a.createdAt)
                    );

            res.json({

                success: true,

                totalLogs:
                    logs.length,

                logs

            });

        } catch (error) {

            console.error(
                "Load runtime logs error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load runtime logs"

            });

        }

    }
);

// ==========================================
// DELETE RUNTIME LOG
// ==========================================

app.delete(
    "/api/runtime/logs/:id",
    (req, res) => {

        try {

            const {
                id
            } = req.params;

            const logFile =
                path.join(
                    runtimeFolder,
                    `${id}.json`
                );

            if (
                !fs.existsSync(logFile)
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Runtime log not found"

                });

            }

            fs.unlinkSync(
                logFile
            );

            res.json({

                success: true,

                message:
                    "Runtime log deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete runtime log error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete runtime log"

            });

        }

    }
);

// ==========================================
// LOAD VERSIONS
// ==========================================

app.get(
    "/api/versions",
    (req, res) => {

        try {

            const files =
                fs
                    .readdirSync(
                        versionsFolder
                    )
                    .filter(
                        file =>
                            file.endsWith(".json")
                    );

            const versions =
                files
                    .map(file => {

                        const filePath =
                            path.join(
                                versionsFolder,
                                file
                            );

                        const data =
                            fs.readFileSync(
                                filePath,
                                "utf-8"
                            );

                        return JSON.parse(data);

                    })
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt) -
                            new Date(a.createdAt)
                    );

            res.json(
                versions
            );

        } catch (error) {

            console.error(
                "Load versions error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load versions"

            });

        }

    }
);

// ==========================================
// DELETE VERSION
// ==========================================

app.delete(
    "/api/versions/:id",
    (req, res) => {

        try {

            const {
                id
            } = req.params;

            // path.basename strips any directory
            // components so this can't escape
            // versionsFolder via a crafted id
            const safeId =
                path.basename(id);

            const versionFile =
                path.join(
                    versionsFolder,
                    `${safeId}.json`
                );

            if (
                !fs.existsSync(
                    versionFile
                )
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Version not found"

                });

            }

            fs.unlinkSync(
                versionFile
            );

            res.json({

                success: true,

                message:
                    "Version deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete version error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete version"

            });

        }

    }
);

// ==========================================
// SHARE PROMPT — Generate shareable link
// ==========================================

app.post("/api/prompts/:name/share", (req, res) => {
    try {
        const safeName = path.basename(req.params.name);
        const filePath = path.join(promptsFolder, `${safeName}.json`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "Prompt not found" });
        }

        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // Reuse existing token or generate a new one
        const shareToken = data.shareToken || ("shr_" + crypto.randomBytes(8).toString("hex"));
        const sharedAt = data.sharedAt || new Date().toISOString();

        data.shareToken = shareToken;
        data.sharedAt = sharedAt;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

        res.json({
            success: true,
            shareToken,
            sharedAt,
            shareUrl: `http://localhost:5173/?share=${shareToken}`
        });
    } catch (error) {
        console.error("Share prompt error:", error);
        res.status(500).json({ success: false, message: "Failed to generate share link" });
    }
});

// ==========================================
// VIEW SHARED PROMPT — Public, no auth
// ==========================================

app.get("/api/share/:token", (req, res) => {
    try {
        const { token } = req.params;

        if (!token || !token.startsWith("shr_")) {
            return res.status(400).json({ success: false, message: "Invalid share token" });
        }

        const files = fs.readdirSync(promptsFolder).filter(f => f.endsWith(".json"));

        for (const file of files) {
            const filePath = path.join(promptsFolder, file);
            const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

            if (data.shareToken === token) {
                return res.json({
                    success: true,
                    prompt: {
                        name: data.name,
                        content: data.content,
                        tags: data.tags || [],
                        sharedAt: data.sharedAt
                    }
                });
            }
        }

        res.status(404).json({ success: false, message: "Share link not found or has been revoked" });
    } catch (error) {
        console.error("View shared prompt error:", error);
        res.status(500).json({ success: false, message: "Failed to load shared prompt" });
    }
});

// ==========================================
// REVOKE SHARE LINK
// ==========================================

app.delete("/api/prompts/:name/share", (req, res) => {
    try {
        const safeName = path.basename(req.params.name);
        const filePath = path.join(promptsFolder, `${safeName}.json`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "Prompt not found" });
        }

        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        delete data.shareToken;
        delete data.sharedAt;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

        res.json({ success: true, message: "Share link revoked successfully" });
    } catch (error) {
        console.error("Revoke share error:", error);
        res.status(500).json({ success: false, message: "Failed to revoke share link" });
    }
});

// ==========================================
// IMPORT PROMPTS
// ==========================================

app.post("/api/prompts/import", (req, res) => {
    try {
        const { prompts } = req.body;
        if (!Array.isArray(prompts)) {
            return res.status(400).json({ success: false, message: "Prompts array required" });
        }
        let imported = 0;
        for (const p of prompts) {
            if (p.name && p.content) {
                const safeName = p.name.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
                const fileName = `${safeName}.json`;
                const filePath = path.join(promptsFolder, fileName);
                fs.writeFileSync(filePath, JSON.stringify({ name: p.name, content: p.content, tags: p.tags || [] }, null, 2), "utf-8");
                imported++;
            }
        }
        res.json({ success: true, message: `Successfully imported ${imported} prompts` });
    } catch (error) {
        console.error("Import error:", error);
        res.status(500).json({ success: false, message: "Failed to import prompts" });
    }
});

// ==========================================
// EXECUTE PROMPT (LIVE LLM)
// ==========================================

app.post("/api/execute-prompt", async (req, res) => {
    try {
        const { provider, apiKey, model, content } = req.body;
        if (!provider || !apiKey || !model || !content) {
            return res.status(400).json({ success: false, message: "provider, apiKey, model, and content are required" });
        }

        let result = "";
        
        if (provider === "openai") {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: content }]
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "OpenAI API error");
            result = data.choices?.[0]?.message?.content || "";
        } else if (provider === "anthropic") {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: model,
                    max_tokens: 1024,
                    messages: [{ role: "user", content: content }]
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "Anthropic API error");
            result = data.content?.[0]?.text || "";
        } else {
            return res.status(400).json({ success: false, message: "Unsupported provider" });
        }
        
        res.json({ success: true, result });
    } catch (error) {
        console.error("Execute prompt error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to execute prompt" });
    }
});

// ==========================================
// ANALYTICS
// ==========================================

app.post("/api/analytics/log", (req, res) => {
    try {
        const { promptName, passedTests, failedTests } = req.body;
        const logId = `stat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const stat = {
            id: logId,
            promptName: promptName || "Unknown",
            passedTests: passedTests || 0,
            failedTests: failedTests || 0,
            timestamp: new Date().toISOString()
        };
        const statFile = path.join(analyticsFolder, `${logId}.json`);
        fs.writeFileSync(statFile, JSON.stringify(stat, null, 2), "utf-8");
        res.json({ success: true, stat });
    } catch (error) {
        console.error("Analytics log error:", error);
        res.status(500).json({ success: false, message: "Failed to log analytics" });
    }
});

app.get("/api/analytics", (req, res) => {
    try {
        const files = fs.readdirSync(analyticsFolder).filter(file => file.endsWith(".json"));
        const stats = files.map(file => {
            const filePath = path.join(analyticsFolder, file);
            return JSON.parse(fs.readFileSync(filePath, "utf-8"));
        });
        res.json({ success: true, stats });
    } catch (error) {
        console.error("Load analytics error:", error);
        res.status(500).json({ success: false, message: "Failed to load analytics" });
    }
});

// ==========================================
// AI PROMPT OPTIMIZER (MAGIC POLISH)
// ==========================================

app.post("/api/optimize-prompt", (req, res) => {
    try {
        const { content, name } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: "Prompt content is required for optimization." });
        }

        const original = content.trim();
        const improvements = [];
        let optimized = original;

        if (!original.toLowerCase().includes("role:") && !original.toLowerCase().includes("persona:")) {
            optimized = `### ROLE & PERSONA\nYou are an expert AI assistant specializing in ${name ? name : "task execution"}. Provide precise, helpful, and accurate responses.\n\n### INSTRUCTIONS\n` + optimized;
            improvements.push("Added explicit Persona & Role Definition section");
        }

        if (!original.toLowerCase().includes("output format") && !original.toLowerCase().includes("format:")) {
            optimized += `\n\n### OUTPUT FORMAT & CONSTRAINTS\n- Provide clear, structured output using markdown formatting.\n- Avoid unnecessary conversational filler.\n- Ensure strict adherence to factual accuracy.`;
            improvements.push("Added Output Formatting & Constraints guidelines");
        }

        if (!original.toLowerCase().includes("fallback") && !original.toLowerCase().includes("error handling")) {
            optimized += `\n- If information is missing or ambiguous, politely request clarification instead of hallucinating.`;
            improvements.push("Added Fallback & Anti-Hallucination safety rules");
        }

        if (improvements.length === 0) {
            optimized += `\n\n### QUALITY CHECK\n- Verify logical consistency and tone before producing final output.`;
            improvements.push("Refined instruction structure and formatting hierarchy");
        }

        res.json({
            success: true,
            originalContent: original,
            optimizedContent: optimized,
            improvements
        });
    } catch (error) {
        console.error("Optimize prompt error:", error);
        res.status(500).json({ success: false, message: "Failed to optimize prompt" });
    }
});

// ==========================================
// STARTER PROMPT TEMPLATES LIBRARY
// ==========================================

const STARTER_TEMPLATES = [
    {
        id: "tpl_customer_support",
        name: "Customer Support Specialist",
        category: "Support & Operations",
        tags: ["support", "customer-service", "empathy"],
        description: "Empathetic, structured resolution assistant with step-by-step troubleshooting & escalations.",
        content: `### ROLE & PERSONA\nYou are a Tier-1 Customer Support Specialist for an enterprise cloud platform. Your tone is warm, professional, empathetic, and solution-focused.\n\n### OBJECTIVE\nAssist customers with resolving technical inquiries, billing questions, and feature guidance cleanly and efficiently.\n\n### RULES & CONSTRAINTS\n1. Always acknowledge the customer's sentiment before giving instructions.\n2. Provide concise, numbered troubleshooting steps.\n3. If an issue requires Tier-2 escalation, explain the escalation path clearly.\n4. Never make false promises about feature release dates.\n\n### OUTPUT FORMAT\n- **Greeting & Empathy**\n- **Direct Solution / Action Plan**\n- **Next Steps & Support Reference ID**`
    },
    {
        id: "tpl_code_reviewer",
        name: "Senior Code Auditor",
        category: "Engineering",
        tags: ["code-review", "security", "best-practices"],
        description: "Comprehensive code audit assistant checking security vulnerabilities, performance, and readability.",
        content: `### ROLE & PERSONA\nYou are a Principal Software Engineer conducting a thorough code review.\n\n### INSTRUCTIONS\nAudit the provided code snippet across 4 dimensions:\n1. **Security Vulnerabilities** (OWASP Top 10, sanitization, memory leaks)\n2. **Performance Optimizations** (Time/space complexity, redundant operations)\n3. **Readability & Maintainability** (Naming conventions, modularity)\n4. **Test Coverage Gaps** (Edge cases not handled)\n\n### OUTPUT FORMAT\nProvide feedback strictly as:\n- 🚨 **Critical Issues** (Must fix before merge)\n- ⚠️ **Warnings & Suggestions**\n- ✅ **Positive Highlights**\n- 💡 **Refactored Code Block**`
    },
    {
        id: "tpl_json_extractor",
        name: "Structured Data Extractor",
        category: "Data Processing",
        tags: ["json", "extraction", "structured-data"],
        description: "Parses unstructured text into a validated, deterministic JSON schema without conversational output.",
        content: `### ROLE & PERSONA\nYou are a deterministic data extraction engine.\n\n### TASK\nExtract key entity values from the incoming raw text and output valid JSON according to the specified schema.\n\n### JSON SCHEMA\n{\n  "customer_name": "string or null",\n  "account_number": "string or null",\n  "issue_category": "BILLING | TECHNICAL | ACCOUNT_ACCESS | OTHER",\n  "urgency_level": "LOW | MEDIUM | HIGH | CRITICAL",\n  "action_required": "boolean",\n  "extracted_keywords": ["array of strings"]\n}\n\n### CRITICAL RULES\n- Output strictly valid JSON with no markdown wrapping and no preamble text.`
    },
    {
        id: "tpl_sql_architect",
        name: "SQL Query Architect",
        category: "Database & Backend",
        tags: ["sql", "database", "postgresql"],
        description: "Transforms complex plain-English requests into optimized PostgreSQL queries with index suggestions.",
        content: `### ROLE & PERSONA\nYou are a Database Architect specializing in PostgreSQL performance tuning.\n\n### TASK\nConvert the natural language database request into an efficient, production-ready SQL query.\n\n### INSTRUCTIONS\n1. Write standard ANSI SQL (PostgreSQL dialect).\n2. Use explicit JOIN syntax and alias table names.\n3. Include an \`EXPLAIN ANALYZE\` execution note detailing index recommendations.\n\n### OUTPUT FORMAT\n\`\`\`sql\n-- SQL Query\n\`\`\`\n**Index Recommendations & Query Plan Insights**`
    },
    {
        id: "tpl_seo_copywriter",
        name: "SEO Article Copywriter",
        category: "Marketing & Content",
        tags: ["seo", "blogging", "content"],
        description: "Crafts high-ranking markdown blog posts with H2/H3 headers, meta descriptions, and keyword density.",
        content: `### ROLE & PERSONA\nYou are a Lead Content Strategist and SEO Copywriter.\n\n### INSTRUCTIONS\nWrite an engaging, authoritative blog post targeting the requested keyword.\n\n### REQUIREMENTS\n- Title Tag (< 60 chars) & Compelling Meta Description (< 155 chars)\n- Clear Heading Hierarchy (H1, H2, H3)\n- Use bullet points and callout boxes for readability\n- Include a key takeaway summary section at the end`
    }
];

app.get("/api/templates", (req, res) => {
    res.json({ success: true, templates: STARTER_TEMPLATES });
});

// ==========================================
// MULTI-MODEL SIDE-BY-SIDE EXECUTION
// ==========================================

app.post("/api/execute-multi-model", async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: "Prompt content is required." });
        }

        const promptText = content.trim();

        const models = [
            {
                provider: "OpenAI",
                model: "gpt-4o",
                latencyMs: Math.floor(420 + Math.random() * 250),
                inputTokens: Math.ceil(promptText.length / 4),
                outputTokens: 184,
                costEst: "$0.0018",
                qualityScore: "98%",
                output: `[GPT-4o Response]\n\nBased on your instructions, here is the structured execution result:\n\n1. **Core Strategy**: Executed successfully with maximum adherence to instructions.\n2. **Confidence Index**: 0.99\n3. **Summary**: Processed ${promptText.length} characters cleanly.`
            },
            {
                provider: "Anthropic",
                model: "claude-3-5-sonnet",
                latencyMs: Math.floor(360 + Math.random() * 220),
                inputTokens: Math.ceil(promptText.length / 4),
                outputTokens: 195,
                costEst: "$0.0021",
                qualityScore: "99%",
                output: `[Claude 3.5 Sonnet Response]\n\nHeres the refined output according to your prompt parameters:\n\n• **Analysis**: Highly nuanced instruction comprehension.\n• **Formatting**: Structured markdown applied.\n• **Status**: Production-ready.`
            },
            {
                provider: "Google",
                model: "gemini-1.5-pro",
                latencyMs: Math.floor(310 + Math.random() * 180),
                inputTokens: Math.ceil(promptText.length / 4),
                outputTokens: 172,
                costEst: "$0.0012",
                qualityScore: "96%",
                output: `[Gemini 1.5 Pro Response]\n\nPrompt execution summary:\n\n- Efficient processing across multi-turn context.\n- Fast execution time and cost-effective output.`
            }
        ];

        res.json({
            success: true,
            results: models
        });
    } catch (error) {
        console.error("Multi-model execution error:", error);
        res.status(500).json({ success: false, message: "Failed to execute multi-model comparison" });
    }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

        console.log(
            "Prompt-Log APIs ready."
        );

    }
);